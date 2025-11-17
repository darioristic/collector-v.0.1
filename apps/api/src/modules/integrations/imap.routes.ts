import type { FastifyPluginAsync } from "fastify";
import { ImapIntegrationService, type ImapSettings } from "./imap.service";

const imapRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new ImapIntegrationService(fastify.db, fastify.log);

  fastify.post("/settings", {
    schema: {
      tags: ["integrations"],
      body: {
        type: "object",
        required: ["host", "port", "secure", "username", "password"],
        properties: {
          host: { type: "string" },
          port: { type: "number" },
          secure: { type: "boolean" },
          username: { type: "string" },
          password: { type: "string" },
          syncEmails: { type: "boolean" },
          syncContacts: { type: "boolean" },
          syncCalendar: { type: "boolean" },
          folders: { type: "array", items: { type: "string" } },
          intervalSeconds: { type: "number" }
        }
      }
    }
  }, async (req, reply) => {
    try {
      await service.saveSettings(req.body as unknown as ImapSettings);
      return reply.code(200).send({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save IMAP settings";
      fastify.log.error({ err: error }, "Failed to save IMAP settings");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.post("/connect", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    try {
      await service.connect();
      const mailboxes = await service.listMailboxes();
      return reply.send({ ok: true, mailboxes });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to connect to IMAP server";
      fastify.log.error({ err: error }, "Failed to connect to IMAP");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.post("/sync", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    try {
      const res = await service.sync();
      return reply.send(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync IMAP";
      fastify.log.error({ err: error }, "Failed to sync IMAP");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.get("/status", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    return reply.send(service.status());
  });

  fastify.get("/messages", {
    schema: {
      tags: ["integrations"],
      querystring: {
        type: "object",
        properties: {
          folder: { type: "string" },
          limit: { type: "number" },
          unreadOnly: { type: "boolean" }
        }
      }
    }
  }, async (req, reply) => {
    const folder = (req.query as { folder?: string }).folder;
    const limit = Number((req.query as { limit?: number }).limit ?? 50);
    const unreadOnly = Boolean((req.query as { unreadOnly?: boolean }).unreadOnly ?? false);
    const items = await service.listMessages({ folder, limit, unreadOnly });
    return reply.send({ items });
  });

  fastify.get("/message", {
    schema: {
      tags: ["integrations"],
      querystring: {
        type: "object",
        properties: { uid: { type: "number" } },
        required: ["uid"]
      }
    }
  }, async (req, reply) => {
    const { uid } = req.query as { uid: number };
    const res = await service.getMessage(uid);
    return reply.send(res);
  });
};

export default imapRoutes;
