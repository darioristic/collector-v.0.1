import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  CreateTimeEntryInput,
  ProjectTimeEntry,
  UpdateTimeEntryInput
} from "./projects.types";

export type ProjectParams = { id: string };
export type TimeEntryParams = { id: string; entryId: string };
export type ListTimeEntriesReply = ApiDataReply<ProjectTimeEntry[]>;
export type CreateTimeEntryReply = ApiDataReply<ProjectTimeEntry>;
export type UpdateTimeEntryReply = ApiDataReply<ProjectTimeEntry>;

export const listProjectTimeEntriesHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListTimeEntriesReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const entries = await request.projectsService.listTimeEntries(request.params.id);
  return reply.status(200).send({ data: entries });
};

export const createProjectTimeEntryHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateTimeEntryInput;
  Reply: CreateTimeEntryReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  try {
    const entry = await request.projectsService.createTimeEntry(request.params.id, request.body);
    return reply.status(201).send({ data: entry });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create time entry");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create time entry", { error: "Internal Server Error" }));
  }
};

export const updateProjectTimeEntryHandler: RouteHandler<{
  Params: TimeEntryParams;
  Body: UpdateTimeEntryInput;
  Reply: UpdateTimeEntryReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const entry = await request.projectsService.updateTimeEntry(
    request.params.id,
    request.params.entryId,
    request.body
  );

  if (!entry) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Time entry ${request.params.entryId} not found`, { error: "Not Found" })
      );
  }

  return reply.status(200).send({ data: entry });
};

export const deleteProjectTimeEntryHandler: RouteHandler<{
  Params: TimeEntryParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const deleted = await request.projectsService.deleteTimeEntry(
    request.params.id,
    request.params.entryId
  );

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Time entry ${request.params.entryId} not found`, { error: "Not Found" })
      );
  }

  return reply.status(204).send();
};

