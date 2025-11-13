import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  AddTeamMemberInput,
  CreateTeamInput,
  ProjectTeam,
  ProjectTeamMember,
  UpdateTeamInput
} from "./projects.types";

export type ProjectParams = { id: string };
export type TeamParams = { id: string; userId: string };
export type TeamEntityParams = { id: string; teamId: string };
export type ListTeamReply = ApiDataReply<ProjectTeamMember[]>;
export type ListTeamsReply = ApiDataReply<ProjectTeam[]>;
export type AddTeamMemberReply = ApiDataReply<ProjectTeamMember>;
export type CreateTeamReply = ApiDataReply<ProjectTeam>;
export type UpdateTeamReply = ApiDataReply<ProjectTeam>;

export const listProjectTeamHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListTeamReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const team = await request.projectsService.listTeamMembers(request.params.id);
  return reply.status(200).send({ data: team });
};

export const addProjectTeamMemberHandler: RouteHandler<{
  Params: ProjectParams;
  Body: AddTeamMemberInput;
  Reply: AddTeamMemberReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const member = await request.projectsService.addTeamMember(request.params.id, request.body);

  if (!member) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `User ${request.body.userId} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(201).send({ data: member });
};

export const removeProjectTeamMemberHandler: RouteHandler<{
  Params: TeamParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const removed = await request.projectsService.removeTeamMember(
    request.params.id,
    request.params.userId
  );

  if (!removed) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Member ${request.params.userId} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

export const listProjectTeamsHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListTeamsReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const teams = await request.projectsService.listTeams(request.params.id);
  return reply.status(200).send({ data: teams });
};

export const createProjectTeamHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateTeamInput;
  Reply: CreateTeamReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  try {
    const team = await request.projectsService.createTeam(request.params.id, request.body);
    return reply.status(201).send({ data: team });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create team");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create team", { error: "Internal Server Error" }));
  }
};

export const updateProjectTeamHandler: RouteHandler<{
  Params: TeamEntityParams;
  Body: UpdateTeamInput;
  Reply: UpdateTeamReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const team = await request.projectsService.updateTeam(
    request.params.id,
    request.params.teamId,
    request.body
  );

  if (!team) {
    return reply
      .status(404)
      .send(createHttpError(404, `Team ${request.params.teamId} not found`, { error: "Not Found" }));
  }

  return reply.status(200).send({ data: team });
};

export const deleteProjectTeamHandler: RouteHandler<{
  Params: TeamEntityParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const deleted = await request.projectsService.deleteTeam(request.params.id, request.params.teamId);

  if (!deleted) {
    return reply
      .status(404)
      .send(createHttpError(404, `Team ${request.params.teamId} not found`, { error: "Not Found" }));
  }

  return reply.status(204).send();
};

