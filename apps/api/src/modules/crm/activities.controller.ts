import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply, type ApiReply } from "../../lib/errors";

import type {
  Activity,
  ActivityCreateInput,
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  ActivityUpdateInput
} from "@crm/types";

export type ListActivitiesQuery = {
  type?: ActivityType;
  clientId?: string;
  assignedTo?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};
export type ListActivitiesReply = ApiDataReply<Activity[]>;
export type GetActivityParams = { id: string };
export type GetActivityReply = ApiDataReply<Activity>;
export type CreateActivityBody = ActivityCreateInput;
export type CreateActivityReply = ApiDataReply<Activity>;
export type UpdateActivityParams = GetActivityParams;
export type UpdateActivityBody = ActivityUpdateInput;
export type UpdateActivityReply = ApiDataReply<Activity>;
export type DeleteActivityParams = GetActivityParams;

export const listActivities: RouteHandler<{
  Querystring: ListActivitiesQuery;
  Reply: ListActivitiesReply;
}> = async (request) => {
  const activities = await request.crmService.listActivities();

  const filtered = activities.filter((activity) => {
    if (request.query.type && activity.type !== request.query.type) {
      return false;
    }

    if (request.query.clientId && activity.clientId !== request.query.clientId) {
      return false;
    }

    if (request.query.assignedTo && activity.assignedTo !== request.query.assignedTo) {
      return false;
    }

    if (request.query.status && activity.status !== request.query.status) {
      return false;
    }

    if (request.query.priority && activity.priority !== request.query.priority) {
      return false;
    }

    if (request.query.dateFrom) {
      const dueDate = new Date(activity.dueDate);
      if (Number.isNaN(dueDate.getTime()) || dueDate < new Date(request.query.dateFrom)) {
        return false;
      }
    }

    if (request.query.dateTo) {
      const dueDate = new Date(activity.dueDate);
      if (Number.isNaN(dueDate.getTime()) || dueDate > new Date(request.query.dateTo)) {
        return false;
      }
    }

    return true;
  });

  const offset = request.query.offset ?? 0;
  const limit = request.query.limit ?? filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  return { data: sliced };
};

export const getActivity: RouteHandler<{
  Params: GetActivityParams;
  Reply: GetActivityReply;
}> = async (request, reply) => {
  const activity = await request.crmService.getActivity(request.params.id);

  if (!activity) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Activity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return { data: activity };
};

export const createActivity: RouteHandler<{
  Body: CreateActivityBody;
  Reply: CreateActivityReply;
}> = async (request, reply) => {
  const activity = await request.crmService.createActivity(request.body);
  return reply.code(201).send({ data: activity });
};

export const updateActivity: RouteHandler<{
  Params: UpdateActivityParams;
  Body: UpdateActivityBody;
  Reply: UpdateActivityReply;
}> = async (request, reply) => {
  const updated = await request.crmService.updateActivity(request.params.id, request.body);

  if (!updated) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Activity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return { data: updated };
};

export const deleteActivity: RouteHandler<{
  Params: DeleteActivityParams;
  Reply: ApiReply<void>;
}> = async (request, reply) => {
  const deleted = await request.crmService.deleteActivity(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Activity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return reply.status(204).send();
};

