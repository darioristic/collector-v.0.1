import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";

import type {
  CreateTimelineEventInput,
  ProjectTimelineEvent,
  UpdateTimelineEventInput
} from "./projects.types";

export type ProjectParams = { id: string };
export type TimelineParams = { id: string; eventId: string };
export type ListMilestonesReply = ApiDataReply<ProjectTimelineEvent[]>;
export type CreateMilestoneReply = ApiDataReply<ProjectTimelineEvent>;
export type UpdateMilestoneReply = ApiDataReply<ProjectTimelineEvent>;

export const listProjectMilestonesHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListMilestonesReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const timeline = await request.projectsService.listTimeline(request.params.id);

  return reply.status(200).send({ data: timeline });
};

export const createProjectMilestoneHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateTimelineEventInput;
  Reply: CreateMilestoneReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  try {
    const event = await request.projectsService.createTimelineEvent(request.params.id, request.body);
    return reply.status(201).send({ data: event });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create timeline event");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create timeline event", { error: "Internal Server Error" }));
  }
};

export const updateProjectMilestoneHandler: RouteHandler<{
  Params: TimelineParams;
  Body: UpdateTimelineEventInput;
  Reply: UpdateMilestoneReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const event = await request.projectsService.updateTimelineEvent(
    request.params.id,
    request.params.eventId,
    request.body
  );

  if (!event) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Timeline event ${request.params.eventId} not found`, { error: "Not Found" })
      );
  }

  return reply.status(200).send({ data: event });
};

export const deleteProjectMilestoneHandler: RouteHandler<{
  Params: TimelineParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const deleted = await request.projectsService.deleteTimelineEvent(
    request.params.id,
    request.params.eventId
  );

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Timeline event ${request.params.eventId} not found`, { error: "Not Found" })
      );
  }

  return reply.status(204).send();
};

