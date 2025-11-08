import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";

import type { CreateTaskBody, Task } from "./projects.schema";
import { findProjectById } from "./projects.controller";

export type ProjectParams = { id: string };
export type ListTasksReply = ApiDataReply<Task[]>;
export type CreateTaskReply = ApiDataReply<Task>;

const addDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const tasksStore: Task[] = [
  {
    id: "task_001",
    projectId: "proj_001",
    title: "Regional launch readiness",
    assignee: "alice@collector.io",
    dueDate: addDays(14),
    status: "inProgress"
  },
  {
    id: "task_002",
    projectId: "proj_001",
    title: "Localization review",
    assignee: "bob@collector.io",
    dueDate: addDays(7),
    status: "todo"
  },
  {
    id: "task_003",
    projectId: "proj_002",
    title: "Define analytics KPIs",
    assignee: "carla@collector.io",
    dueDate: addDays(21),
    status: "todo"
  }
];

export const tasksMockStore = tasksStore;

const ensureProjectExists = (projectId: string) => {
  const project = findProjectById(projectId);

  if (!project) {
    return null;
  }

  return project;
};

export const listProjectTasksHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListTasksReply;
}> = async (request, reply) => {
  const project = ensureProjectExists(request.params.id);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const tasks = tasksStore.filter((task) => task.projectId === project.id);

  return { data: tasks };
};

export const createProjectTaskHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateTaskBody;
  Reply: CreateTaskReply;
}> = async (request, reply) => {
  const project = ensureProjectExists(request.params.id);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const newTask: Task = {
    id: randomUUID(),
    projectId: project.id,
    ...request.body
  };

  tasksStore.push(newTask);

  reply.code(201);
  return { data: newTask };
};


