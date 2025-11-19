import type { FastifyPluginAsync } from "fastify";

import salesRoutes from "./sales.routes";
import { createSalesService } from "./sales.service";

const salesModule: FastifyPluginAsync = async (fastify) => {
  const service = createSalesService(fastify.db);

  if (!fastify.hasDecorator("salesService")) {
    fastify.decorate("salesService", service);
  }

  if (!fastify.hasRequestDecorator("salesService")) {
    fastify.decorateRequest("salesService", { getter: () => service });
  }

  await fastify.register(salesRoutes, { prefix: "/sales" });
};

export default salesModule;

