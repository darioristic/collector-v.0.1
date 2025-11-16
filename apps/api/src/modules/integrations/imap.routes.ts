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
    await service.saveSettings(req.body as unknown as ImapSettings);
    return reply.code(200).send({ ok: true });
  });

  fastify.post("/connect", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    await service.connect();
    const mailboxes = await service.listMailboxes();
    return reply.send({ ok: true, mailboxes });
  });

  fastify.post("/sync", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    const res = await service.sync();
    return reply.send(res);
  });

  fastify.get("/status", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    return reply.send(service.status());
  });
};

export default imapRoutes;
