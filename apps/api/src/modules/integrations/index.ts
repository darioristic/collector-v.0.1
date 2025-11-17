import type { FastifyPluginAsync } from "fastify";
import imapRoutes from "./imap.routes";
import smtpRoutes from "./smtp.routes";

const integrationsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(imapRoutes, { prefix: "/integrations/imap" });
  await fastify.register(smtpRoutes, { prefix: "/integrations/smtp" });
};

export default integrationsModule;
