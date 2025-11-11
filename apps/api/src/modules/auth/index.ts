import type { FastifyPluginAsync } from "fastify";

import authRoutes from "./auth.routes";
import { AuthService } from "./auth.service";

const authModule: FastifyPluginAsync = async (app) => {
  const service = new AuthService(app.db);

  await app.register(authRoutes, {
    prefix: "/auth",
    service
  });
};

export default authModule;


