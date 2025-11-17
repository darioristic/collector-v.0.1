import type { FastifyPluginAsync } from "fastify";
import { SmtpIntegrationService, type SmtpSettings } from "./smtp.service";

const smtpRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new SmtpIntegrationService(fastify.db, fastify.log);

  fastify.post("/settings", {
    schema: {
      tags: ["integrations"],
      body: {
        type: "object",
        required: ["host", "port", "secure", "username", "password", "fromEmail"],
        properties: {
          host: { type: "string" },
          port: { type: "number" },
          secure: { type: "boolean" },
          username: { type: "string" },
          password: { type: "string" },
          fromEmail: { type: "string" }
        }
      }
    }
  }, async (req, reply) => {
    try {
      await service.saveSettings(req.body as unknown as SmtpSettings);
      return reply.code(200).send({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save SMTP settings";
      fastify.log.error({ err: error }, "Failed to save SMTP settings");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.post("/send-test", {
    schema: {
      tags: ["integrations"],
      body: {
        type: "object",
        required: ["to"],
        properties: { to: { type: "string" } }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as unknown as { to: string };
      const res = await service.sendTest(body.to);
      return reply.send(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send test email";
      fastify.log.error({ err: error }, "Failed to send test email");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.post("/send", {
    schema: {
      tags: ["integrations"],
      body: {
        type: "object",
        required: ["to", "subject", "html"],
        properties: {
          to: {
            oneOf: [
              { type: "string", format: "email" },
              { type: "array", items: { type: "string", format: "email" } }
            ]
          },
          subject: { type: "string" },
          html: { type: "string" },
          replyTo: { type: "string", format: "email" },
          fromEmail: { type: "string", format: "email" }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const body = req.body as unknown as { to: string | string[]; subject: string; html: string; replyTo?: string; fromEmail?: string };
      const res = await service.send(body);
      return reply.send(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email";
      fastify.log.error({ err: error }, "Failed to send email");
      return reply.code(500).send({ ok: false, error: message });
    }
  });

  fastify.get("/status", { schema: { tags: ["integrations"] } }, async (_req, reply) => {
    return reply.send(service.status());
  });
};

export default smtpRoutes;
