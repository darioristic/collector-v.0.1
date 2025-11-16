import type { FastifyPluginAsync } from "fastify";

import notificationsRoutes from "./notifications.routes";
import preferencesRoutes from "./preferences/preferences.routes";

const notificationsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(notificationsRoutes, { prefix: "/notifications" });
  await fastify.register(preferencesRoutes, {
    prefix: "/notifications/preferences",
  });
};

export default notificationsModule;
export * from "./notifications.controller";
export * from "./notifications.schema";