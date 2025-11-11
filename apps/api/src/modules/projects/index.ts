import type { FastifyPluginAsync } from "fastify";

import projectsRoutes from "./projects.routes";
import { createProjectsService } from "./projects.service";

const projectsModule: FastifyPluginAsync = async (fastify) => {
  const service = createProjectsService(fastify.db);

  if (!fastify.hasDecorator("projectsService")) {
    fastify.decorate("projectsService", service);
  }

  if (!fastify.hasRequestDecorator("projectsService")) {
    fastify.decorateRequest("projectsService", { getter: () => service });
  }

  await fastify.register(projectsRoutes, { prefix: "/projects" });
};

export default projectsModule;


