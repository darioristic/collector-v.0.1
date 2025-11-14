import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  CreateBudgetCategoryInput,
  ProjectBudgetCategory,
  ProjectBudgetSummary,
  UpdateBudgetCategoryInput,
  UpdateBudgetSummaryInput
} from "./projects.types";

export type ProjectParams = { id: string };
export type CategoryParams = { id: string; categoryId: string };
export type BudgetReply = ApiDataReply<ProjectBudgetSummary>;
export type BudgetCategoryReply = ApiDataReply<ProjectBudgetCategory>;

export const getProjectBudgetHandler: RouteHandler<{
  Params: ProjectParams;
  Reply: BudgetReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const budget = await request.projectsService.getBudget(request.params.id);
  const defaultBudget: ProjectBudgetSummary = { currency: "EUR", total: 0, spent: 0, remaining: 0, totalHours: 0, categories: [] };
  return reply.status(200).send({ data: budget ?? defaultBudget });
};

export const updateProjectBudgetHandler: RouteHandler<{
  Params: ProjectParams;
  Body: UpdateBudgetSummaryInput;
  Reply: BudgetReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const budget = await request.projectsService.updateBudget(request.params.id, request.body);

  if (!budget) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(200).send({ data: budget });
};

export const createBudgetCategoryHandler: RouteHandler<{
  Params: ProjectParams;
  Body: CreateBudgetCategoryInput;
  Reply: BudgetCategoryReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  try {
    const category = await request.projectsService.createBudgetCategory(request.params.id, request.body);
    return reply.status(201).send({ data: category });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create budget category");
    return reply
      .status(500)
      .send(createHttpError(500, "Failed to create budget category", { error: "Internal Server Error" }));
  }
};

export const updateBudgetCategoryHandler: RouteHandler<{
  Params: CategoryParams;
  Body: UpdateBudgetCategoryInput;
  Reply: BudgetCategoryReply;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const category = await request.projectsService.updateBudgetCategory(
    request.params.id,
    request.params.categoryId,
    request.body
  );

  if (!category) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Budget category ${request.params.categoryId} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(200).send({ data: category });
};

export const deleteBudgetCategoryHandler: RouteHandler<{
  Params: CategoryParams;
}> = async (request, reply) => {
  const exists = await request.projectsService.projectExists(request.params.id);

  if (!exists) {
    return reply
      .status(404)
      .send(createHttpError(404, `Project ${request.params.id} not found`, { error: "Not Found" }));
  }

  const deleted = await request.projectsService.deleteBudgetCategory(
    request.params.id,
    request.params.categoryId
  );

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Budget category ${request.params.categoryId} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

