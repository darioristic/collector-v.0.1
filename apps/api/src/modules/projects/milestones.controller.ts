import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";

import type { CreateMilestoneBody, Milestone } from "./projects.schema";
import { findProjectById } from "./projects.controller";

export type ProjectParams = { id: string };
export type ListMilestonesReply = ApiDataReply<Milestone[]>;
export type CreateMilestoneReply = ApiDataReply<Milestone>;

const addDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const milestonesStore: Milestone[] = [
  {
    id: "milestone_001",
    projectId: "proj_001",
    title: "Complete pilot rollout",
    targetDate: addDays(30),
    completed: false
  },
  {
    id: "milestone_002",
    projectId: "proj_001",
    title: "Executive go-live approval",
    targetDate: addDays(60),
    completed: false
  },
  {
    id: "milestone_003",
    projectId: "proj_002",
    title: "MVP definition signed off",
    targetDate: addDays(45),
    completed: true
  }
];

export const milestonesMockStore = milestonesStore;

const ensureProjectExists = (projectId: string) => {
  const project = findProjectById(projectId);

  if (!project) {
    return null;
  }

  return project;
};

export const listProjectMilestonesHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: ListMilestonesReply;
}> = async (request, reply) => {
  const project = ensureProjectExists(request.params.id);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const milestones = milestonesStore.filter((milestone) => milestone.projectId === project.id);

  return { data: milestones };
};

export const createProjectMilestoneHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateMilestoneBody;
  Reply: CreateMilestoneReply;
}> = async (request, reply) => {
  const project = ensureProjectExists(request.params.id);

  if (!project) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const newMilestone: Milestone = {
    id: randomUUID(),
    projectId: project.id,
    ...request.body
  };

  milestonesStore.push(newMilestone);

  reply.code(201);
  return { data: newMilestone };
};


