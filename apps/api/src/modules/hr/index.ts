import type { FastifyPluginAsync } from "fastify";

import hrRoutes from "./hr.routes";

const hrModule: FastifyPluginAsync = async (fastify) => {
  // TODO: Inject Settings and Accounts services once their APIs are exposed.
  await fastify.register(hrRoutes, { prefix: "/hr" });
};

export default hrModule;


