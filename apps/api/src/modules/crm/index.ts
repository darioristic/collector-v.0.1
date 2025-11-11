import type { FastifyPluginAsync } from "fastify";

import crmRoutes from "./crm.routes";
import { createCRMService } from "./crm.service";

const crmModule: FastifyPluginAsync = async (fastify) => {
  const service = createCRMService(fastify.db);

  if (!fastify.hasDecorator("crmService")) {
    fastify.decorate("crmService", service);
  }

  if (!fastify.hasRequestDecorator("crmService")) {
    fastify.decorateRequest("crmService", { getter: () => service });
  }

  await fastify.register(crmRoutes, { prefix: "/crm" });
};

export default crmModule;


