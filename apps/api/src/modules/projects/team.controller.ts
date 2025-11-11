import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type { AddTeamMemberInput, ProjectTeamMember } from "./projects.types";

export type ProjectParams = { id: string };
export type TeamParams = { id: string; userId: string };
export type ListTeamReply = ApiDataReply<ProjectTeamMember[]>;
export type AddTeamMemberReply = ApiDataReply<ProjectTeamMember>;

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

