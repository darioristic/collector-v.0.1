import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";

import type { CreateTaskInput, ProjectTask, UpdateTaskInput } from "./projects.types";

export type ProjectParams = { id: string };
export type TaskParams = { id: string; taskId: string };
export type ListTasksReply = ApiDataReply<ProjectTask[]>;
export type CreateTaskReply = ApiDataReply<ProjectTask>;
export type UpdateTaskReply = ApiDataReply<ProjectTask>;

export const listProjectTasksHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListTasksReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const tasks = await request.projectsService.listTasks(request.params.id);

  return reply.status(200).send({ data: tasks });
};

export const createProjectTaskHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateTaskInput;
  Reply: CreateTaskReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  try {
    const task = await request.projectsService.createTask(request.params.id, request.body);
    return reply.status(201).send({ data: task });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create project task");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create task", { error: "Internal Server Error" }));
  }
};

export const updateProjectTaskHandler: RouteHandler<{
  Params: TaskParams;
  Body: UpdateTaskInput;
  Reply: UpdateTaskReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const task = await request.projectsService.updateTask(
    request.params.id,
    request.params.taskId,
    request.body
  );

  if (!task) {
    return reply
      .status(404)
      .send(createHttpError(404, `Task ${request.params.taskId} not found`, { error: "Not Found" }));
  }

  return reply.status(200).send({ data: task });
};

export const deleteProjectTaskHandler: RouteHandler<{
  Params: TaskParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const deleted = await request.projectsService.deleteTask(request.params.id, request.params.taskId);

  if (!deleted) {
    return reply
      .status(404)
      .send(createHttpError(404, `Task ${request.params.taskId} not found`, { error: "Not Found" }));
  }

  return reply.status(204).send();
};
