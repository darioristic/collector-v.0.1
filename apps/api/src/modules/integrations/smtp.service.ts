import type { FastifyBaseLogger } from "fastify";
import { integrations } from "../../db/schema/settings.schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./imap.service";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
};

export class SmtpIntegrationService {
  #db: import("../../db/index.js").AppDatabase;
  #logger: FastifyBaseLogger;
  #status: { connected?: boolean; lastSend?: string; message?: string } = {};

  constructor(db: import("../../db/index.js").AppDatabase, logger: FastifyBaseLogger) {
    this.#db = db;
    this.#logger = logger;
  }

  async saveSettings(settings: SmtpSettings) {
    const encrypted = encrypt(settings.password);
    const toStore = { ...settings, password: JSON.stringify(encrypted) };
    const json = JSON.stringify(toStore);
    const existing = await this.#db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "smtp"));
    if (existing.length > 0) {
      await this.#db
        .update(integrations)
        .set({ settings: json, status: "connected", updatedAt: new Date() })
        .where(eq(integrations.id, (existing as Array<{ id: string }>)[0].id));
    } else {
      await this.#db
        .insert(integrations)
        .values({ provider: "smtp", status: "connected", settings: json });
    }
  }

  async getSettings(): Promise<SmtpSettings | null> {
    const rows = (await this.#db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, "smtp"))) as Array<{ settings?: string }>;
    const row = rows[0];
    if (!row?.settings) return null;
    try {
      const parsed = JSON.parse(row.settings) as SmtpSettings & { password: string };
      let pwd = parsed.password;
      try {
        const enc = JSON.parse(pwd) as { data: string; iv: string; tag: string };
        pwd = decrypt(enc);
      } catch (e) {
        this.#logger.warn({ err: e }, "SMTP password not encrypted or failed to decrypt");
      }
      return { ...parsed, password: pwd } as SmtpSettings;
    } catch (e) {
      this.#logger.error({ err: e }, "Failed to parse SMTP settings");
      return null;
    }
  }

  async sendTest(to: string): Promise<{ ok: boolean; messageId?: string }> {
    const settings = await this.getSettings();
    if (!settings) throw new Error("SMTP settings not configured");
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.username, pass: settings.password }
    });
    const info = await transporter.sendMail({
      from: settings.fromEmail,
      to,
      subject: "SMTP Test",
      html: "<p>SMTP test message from Collector Dashboard</p>"
    });
    this.#status.lastSend = new Date().toISOString();
    this.#status.connected = true;
    this.#status.message = "Sent";
    this.#logger.info({ provider: "smtp", to }, "SMTP test email sent");
    return { ok: true, messageId: (info as { messageId?: string }).messageId };
  }

  async send(payload: { to: string | string[]; subject: string; html: string; replyTo?: string; fromEmail?: string }): Promise<{ ok: boolean; messageId?: string }> {
    const settings = await this.getSettings();
    if (!settings) throw new Error("SMTP settings not configured");
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.username, pass: settings.password }
    });
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    let lastId: string | undefined;
    for (const recipient of recipients) {
      const info = await transporter.sendMail({
        from: payload.fromEmail || settings.fromEmail,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo
      });
      lastId = (info as { messageId?: string }).messageId;
    }
    this.#status.lastSend = new Date().toISOString();
    this.#status.connected = true;
    this.#status.message = "Sent";
    this.#logger.info({ provider: "smtp", to: recipients.length }, "SMTP email sent");
    return { ok: true, messageId: lastId };
  }

  status() {
    return this.#status;
  }
}
