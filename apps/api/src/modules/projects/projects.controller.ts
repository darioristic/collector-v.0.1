import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

import type { CreateProjectBody, Project } from "./projects.schema";

export type ListProjectsReply = { data: Project[] };
export type CreateProjectReply = { data: Project };

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const projectsStore: Project[] = [
  {
    id: "proj_001",
    name: "Global Expansion Rollout",
    accountId: "acc_enterprise_01",
    status: "inProgress",
    startDate: addDays(-30),
    endDate: addDays(90)
  },
  {
    id: "proj_002",
    name: "Customer Insights Platform",
    accountId: "acc_fintech_02",
    status: "draft",
    startDate: today(),
    endDate: addDays(120)
  }
];

export const projectsMockStore = projectsStore;

export const listProjectsHandler: RouteHandler<{ Reply: ListProjectsReply }> = async () => {
  return { data: projectsStore };
};

export const createProjectHandler: RouteHandler<{
  Body: CreateProjectBody;
  Reply: CreateProjectReply;
}> = async (request, reply) => {
  const newProject: Project = {
    id: randomUUID(),
    ...request.body
  };

  projectsStore.push(newProject);

  reply.code(201);
  return { data: newProject };
};

export const findProjectById = (id: string) =>
  projectsStore.find((project) => project.id === id) ?? null;


