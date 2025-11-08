import type { FastifyPluginAsync } from "fastify";

import salesRoutes from "./sales.routes";

const salesModule: FastifyPluginAsync = async (app) => {
  await app.register(salesRoutes, { prefix: "/sales" });
};

export default salesModule;


