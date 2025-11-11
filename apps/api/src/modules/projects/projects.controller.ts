import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  ProjectCreateInput,
  ProjectDetails,
  ProjectSummary,
  ProjectUpdateInput
} from "./projects.types";

export type ListProjectsReply = ApiDataReply<ProjectSummary[]>;
export type CreateProjectReply = ApiDataReply<ProjectDetails>;
export type GetProjectReply = ApiDataReply<ProjectDetails>;
export type UpdateProjectReply = ApiDataReply<ProjectDetails>;

type ProjectParams = { id: string };

export const listProjectsHandler: RouteHandler<{ Reply: ListProjectsReply }> = async (request, reply) => {
  const data = await request.projectsService.list();
  return reply.status(200).send({ data });
};

export const createProjectHandler: RouteHandler<{
  Body: ProjectCreateInput;
  Reply: CreateProjectReply;
}> = async (request, reply) => {
  try {
    const project = await request.projectsService.createProject(request.body);
    return reply.status(201).send({ data: project });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create project");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create project", { error: "Internal Server Error" }));
  }
};

export const getProjectHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: GetProjectReply;
}> = async (request, reply) => {
  const project = await request.projectsService.getProjectDetails(request.params.id);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(200).send({ data: project });
};

export const updateProjectHandler: RouteHandler<{
  Params: ProjectParams;
  Body: ProjectUpdateInput;
  Reply: UpdateProjectReply;
}> = async (request, reply) => {
  const project = await request.projectsService.updateProject(request.params.id, request.body);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(200).send({ data: project });
};

export const deleteProjectHandler: RouteHandler<{
  Params: ProjectParams;
}> = async (request, reply) => {
  const deleted = await request.projectsService.deleteProject(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(204).send();
};
