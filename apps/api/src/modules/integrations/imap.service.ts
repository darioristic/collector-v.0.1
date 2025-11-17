import { ImapFlow } from "imapflow";
import crypto from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import { integrations } from "../../db/schema/settings.schema";
import { eq } from "drizzle-orm";

export type ImapSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // encrypted at rest
  syncEmails: boolean;
  syncContacts: boolean;
  syncCalendar: boolean;
  folders?: string[];
  intervalSeconds?: number;
};

const ALG = "aes-256-gcm";
function getSecret() {
  const key = process.env.IMAP_CREDENTIALS_SECRET || process.env.SECRET_KEY || "dev-secret-please-change";
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(text: string): { data: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, getSecret(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { data: enc.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64") };
}

export function decrypt(payload: { data: string; iv: string; tag: string }): string {
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = crypto.createDecipheriv(ALG, getSecret(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(Buffer.from(payload.data, "base64")), decipher.final()]);
  return dec.toString("utf8");
}

export class ImapIntegrationService {
  #db: import("../../db/index.js").AppDatabase;
  #logger: FastifyBaseLogger;
  #client: ImapFlow | null = null;
  #status: { lastSync?: string; connected?: boolean; message?: string } = {};

  constructor(db: import("../../db/index.js").AppDatabase, logger: FastifyBaseLogger) {
    this.#db = db;
    this.#logger = logger;
  }

  async saveSettings(settings: ImapSettings) {
    const encrypted = encrypt(settings.password);
    const toStore = { ...settings, password: JSON.stringify(encrypted) };
    const json = JSON.stringify(toStore);
    const existing = await this.#db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "imap"));
    if (existing.length > 0) {
      await this.#db
        .update(integrations)
        .set({ settings: json, status: "connected", updatedAt: new Date() })
        .where(eq(integrations.id, (existing as Array<{ id: string }>)[0].id));
    } else {
      await this.#db
        .insert(integrations)
        .values({ provider: "imap", status: "connected", settings: json });
    }
  }

  async getSettings(): Promise<ImapSettings | null> {
    const rows = (await this.#db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "imap"))) as Array<{ settings?: string }>;
    const row = rows[0];
    if (!row?.settings) return null;
    try {
      const parsed = JSON.parse(row.settings) as ImapSettings & { password: string };
      let pwd = parsed.password;
      try {
          const enc = JSON.parse(pwd) as { data: string; iv: string; tag: string };
          pwd = decrypt(enc);
      } catch (e) {
        this.#logger.warn({ err: e }, "IMAP password not encrypted or failed to decrypt");
      }
      return { ...parsed, password: pwd } as ImapSettings;
    } catch (e) {
      this.#logger.error({ err: e }, "Failed to parse IMAP settings");
      return null;
    }
  }

  async connect() {
    const settings = await this.getSettings();
    if (!settings) throw new Error("IMAP settings not configured");
    this.#client = new ImapFlow({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.username, pass: settings.password }
    });
    await this.#client.connect();
    this.#status.connected = true;
    this.#status.message = "Connected";
    this.#logger.info({ provider: "imap" }, "IMAP connected");
    return true;
  }

  async listMailboxes() {
    if (!this.#client) await this.connect();
    const mailboxes: Array<{ path: string; flags: string[] }> = [];
    const list = await this.#client!.list();
    for (const m of list) {
      mailboxes.push({ path: m.path, flags: Array.isArray(m.flags) ? m.flags : Array.from(m.flags ?? []) });
    }
    return mailboxes;
  }

  async sync() {
    if (!this.#client) await this.connect();
    const settings = await this.getSettings();
    const folders = settings?.folders?.length ? settings.folders : ["INBOX"];
    for (const folder of folders) {
      await this.#client!.mailboxOpen(folder);
      const lock = await this.#client!.getMailboxLock(folder);
      try {
        for await (const message of this.#client!.fetch({ seen: false }, { envelope: true, bodyStructure: true, source: true })) {
          this.#logger.info({ folder, from: message.envelope?.from, subject: message.envelope?.subject }, "Fetched message");
          // TODO: persist message metadata
          // TODO: extract and upsert contacts in CRM from message envelope
          // Extract calendar from attachments
          const body = (message as unknown as { bodyStructure?: { childNodes?: unknown[] } }).bodyStructure;
          const nodes = Array.isArray(body?.childNodes) ? (body!.childNodes as Array<{ type?: string; subtype?: string }>) : [];
          const parts = nodes.filter((p) => ((p?.type ?? "").toLowerCase() === "text") && ((p?.subtype ?? "").toLowerCase() === "calendar"));
          for (const _part of parts) {
            // Implementation placeholder: store raw ICS for later processing
            this.#logger.info({ folder, subject: message.envelope?.subject }, "Found calendar attachment");
          }
        }
      } finally {
        lock.release();
      }
    }
    this.#status.lastSync = new Date().toISOString();
    return { ok: true, lastSync: this.#status.lastSync };
  }

  status() {
    return this.#status;
  }

  async listMessages(options: { folder?: string; limit?: number; unreadOnly?: boolean }): Promise<Array<{ id: string; name: string; email: string; subject: string; text: string; date: string; read: boolean; labels: string[]; avatar?: string }>> {
    if (!this.#client) await this.connect();
    const settings = await this.getSettings();
    const folder = options.folder || (settings?.folders?.[0] ?? "INBOX");
    const limit = options.limit ?? 50;
    const unreadOnly = options.unreadOnly ?? false;
    await this.#client!.mailboxOpen(folder);
    const lock = await this.#client!.getMailboxLock(folder);
    try {
      const messages: Array<{ id: string; name: string; email: string; subject: string; text: string; date: string; read: boolean; labels: string[]; avatar?: string }> = [];
      let count = 0;
      const criteria = unreadOnly ? { seen: false } : {};
      for await (const msg of this.#client!.fetch(criteria, { envelope: true, bodyStructure: true, uid: true, flags: true, source: true })) {
        const from = Array.isArray(msg.envelope?.from) ? msg.envelope!.from[0] : undefined;
        const name = (from?.name || from?.address || "") as string;
        const email = (from?.address || "") as string;
        const subject = (msg.envelope?.subject || "") as string;
        const date = (msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString());
        const read = Array.isArray(msg.flags) ? msg.flags.includes("\\Seen") : Array.from(msg.flags ?? []).includes("\\Seen");
        let text = "";
        const source = (msg as unknown as { source?: Buffer | Uint8Array | string }).source;
        if (source) {
          const raw = Buffer.isBuffer(source) ? source.toString("utf8") : Buffer.from(source as Uint8Array).toString("utf8");
          const splitIndex = raw.indexOf("\r\n\r\n");
          text = splitIndex >= 0 ? raw.slice(splitIndex + 4) : raw;
        }
        messages.push({ id: String((msg as { uid?: number }).uid ?? Math.random()), name, email, subject, text, date, read, labels: [] });
        count++;
        if (count >= limit) break;
      }
      return messages;
    } finally {
      lock.release();
    }
  }

  async getMessage(uid: number): Promise<{ id: string; text: string }> {
    if (!this.#client) await this.connect();
    const message = await this.#client!.fetchOne(uid, { source: true, uid: true });
    const source = (message as unknown as { source?: Buffer | Uint8Array | string }).source;
    const raw = source ? (Buffer.isBuffer(source) ? source.toString("utf8") : Buffer.from(source as Uint8Array).toString("utf8")) : "";
    const splitIndex = raw.indexOf("\r\n\r\n");
    const text = splitIndex >= 0 ? raw.slice(splitIndex + 4) : raw;
    return { id: String(uid), text };
  }
}
