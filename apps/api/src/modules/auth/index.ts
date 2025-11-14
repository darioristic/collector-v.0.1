import type { FastifyPluginAsync } from "fastify";

import authRoutes from "./auth.routes";
import { AuthService } from "./auth.service";

const authModule: FastifyPluginAsync = async (app) => {
  const cache = app.hasDecorator("cache") ? app.cache : undefined;
  const service = new AuthService(app.db, cache);

  await app.register(authRoutes, {
    prefix: "/auth",
    service
  });
};

export default authModule;


