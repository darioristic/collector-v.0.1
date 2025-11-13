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

/**
 * Handler za listanje svih projekata.
 * 
 * @route GET /api/projects
 * @returns Lista svih projekata sa osnovnim informacijama i task statistikama
 */
export const listProjectsHandler: RouteHandler<{ Reply: ListProjectsReply }> = async (request, reply) => {
  const data = await request.projectsService.list();
  return reply.status(200).send({ data });
};

/**
 * Handler za kreiranje novog projekta.
 * 
 * @route POST /api/projects
 * @param request.body - Podaci za kreiranje projekta
 * @returns Kreirani projekt sa svim detaljima ili 500 ako kreiranje ne uspe
 */
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

/**
 * Handler za dobijanje projekta po ID-u.
 * 
 * @route GET /api/projects/:id
 * @param request.params.id - UUID projekta
 * @returns Detalji projekta sa zadacima, timeline, timom i budžetom ili 404 ako nije pronađen
 */
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

/**
 * Handler za ažuriranje postojećeg projekta.
 * 
 * @route PUT /api/projects/:id
 * @param request.params.id - UUID projekta
 * @param request.body - Podaci za ažuriranje (parcijalni)
 * @returns Ažurirani projekt ili 404 ako nije pronađen
 */
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

/**
 * Handler za brisanje projekta.
 * 
 * @route DELETE /api/projects/:id
 * @param request.params.id - UUID projekta
 * @returns 204 No Content ako je uspešno obrisan ili 404 ako nije pronađen
 */
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
