import type { FastifyPluginAsync } from "fastify";

import notificationsRoutes from "./notifications.routes";

const notificationsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(notificationsRoutes, { prefix: "/notifications" });
};

export default notificationsModule;
export * from "./notifications.controller";
export * from "./notifications.schema";