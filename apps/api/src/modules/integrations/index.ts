import type { FastifyPluginAsync } from "fastify";
import imapRoutes from "./imap.routes";

const integrationsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(imapRoutes, { prefix: "/integrations/imap" });
};

export default integrationsModule;

