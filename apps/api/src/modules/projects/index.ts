import type { FastifyPluginAsync } from "fastify";

import projectsRoutes from "./projects.routes";

const projectsModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(projectsRoutes, { prefix: "/projects" });
};

export default projectsModule;


