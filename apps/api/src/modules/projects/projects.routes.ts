import type { FastifyPluginAsync } from "fastify";

import {
  createMilestoneSchema,
  createProjectSchema,
  createTaskSchema,
  listMilestonesSchema,
  listProjectsSchema,
  listTasksSchema
} from "./projects.schema";
import { createProjectHandler, listProjectsHandler } from "./projects.controller";
import {
  createProjectTaskHandler,
  listProjectTasksHandler
} from "./tasks.controller";
import {
  createProjectMilestoneHandler,
  listProjectMilestonesHandler
} from "./milestones.controller";

const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { schema: listProjectsSchema }, listProjectsHandler);
  fastify.post("/", { schema: createProjectSchema }, createProjectHandler);

  fastify.get("/:id/tasks", { schema: listTasksSchema }, listProjectTasksHandler);
  fastify.post("/:id/tasks", { schema: createTaskSchema }, createProjectTaskHandler);

  fastify.get("/:id/milestones", { schema: listMilestonesSchema }, listProjectMilestonesHandler);
  fastify.post(
    "/:id/milestones",
    { schema: createMilestoneSchema },
    createProjectMilestoneHandler
  );
};

export default projectsRoutes;


