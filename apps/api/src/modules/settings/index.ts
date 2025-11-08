import type { FastifyPluginAsync } from "fastify";

import settingsRoutes from "./settings.routes";

const settingsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(settingsRoutes, { prefix: "/settings" });
};

export default settingsModule;


