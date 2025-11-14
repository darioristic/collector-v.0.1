import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  PerformanceReview,
  PerformanceReviewCreateInput,
  PerformanceReviewListFilters,
  PerformanceReviewUpdateInput
} from "./performance-reviews.service";



export type ListPerformanceReviewsQuery = {
  employeeId?: string;
  reviewerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ListPerformanceReviewsReply = ApiDataReply<PerformanceReview[]> & {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetPerformanceReviewParams = { id: string };
export type GetPerformanceReviewReply = ApiDataReply<PerformanceReview>;
export type CreatePerformanceReviewBody = PerformanceReviewCreateInput;
export type CreatePerformanceReviewReply = ApiDataReply<PerformanceReview>;
export type UpdatePerformanceReviewParams = GetPerformanceReviewParams;
export type UpdatePerformanceReviewBody = PerformanceReviewUpdateInput;
export type UpdatePerformanceReviewReply = ApiDataReply<PerformanceReview>;
export type DeletePerformanceReviewParams = GetPerformanceReviewParams;

export const listPerformanceReviews: RouteHandler<{
  Querystring: ListPerformanceReviewsQuery;
  Reply: ListPerformanceReviewsReply;
}> = async (request) => {
  const filters: PerformanceReviewListFilters = {
    employeeId: request.query.employeeId,
    reviewerId: request.query.reviewerId,
    search: request.query.search,
    limit: request.query.limit,
    offset: request.query.offset
  };

  const result = await request.performanceReviewsService.list(filters);

  return {
    data: result.data,
    pagination: result.pagination
  };
};

export const getPerformanceReview: RouteHandler<{
  Params: GetPerformanceReviewParams;
  Reply: GetPerformanceReviewReply;
}> = async (request, reply) => {
  const review = await request.performanceReviewsService.getById(request.params.id);

  if (!review) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Performance review ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: review };
};

export const createPerformanceReview: RouteHandler<{
  Body: CreatePerformanceReviewBody;
  Reply: CreatePerformanceReviewReply;
}> = async (request, reply) => {
  try {
    const review = await request.performanceReviewsService.create(request.body);
    return reply.status(201).send({ data: review });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create performance review");
    return reply
      .status(500)
      .send(
        createHttpError(500, "Failed to create performance review", {
          error: "Internal Server Error"
        })
      );
  }
};

export const updatePerformanceReview: RouteHandler<{
  Params: UpdatePerformanceReviewParams;
  Body: UpdatePerformanceReviewBody;
  Reply: UpdatePerformanceReviewReply;
}> = async (request, reply) => {
  const review = await request.performanceReviewsService.update(
    request.params.id,
    request.body
  );

  if (!review) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Performance review ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: review };
};

export const deletePerformanceReview: RouteHandler<{
  Params: DeletePerformanceReviewParams;
}> = async (request, reply) => {
  const deleted = await request.performanceReviewsService.delete(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Performance review ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

