import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply, type ApiReply } from "../../lib/errors";

import type {
  Opportunity,
  OpportunityCreateInput,
  OpportunityStage,
  OpportunityUpdateInput
} from "@crm/types";

export type ListOpportunitiesQuery = {
  stage?: OpportunityStage;
  accountId?: string;
  minProbability?: number;
  limit?: number;
  offset?: number;
};
export type ListOpportunitiesReply = ApiDataReply<Opportunity[]>;
export type GetOpportunityParams = { id: string };
export type GetOpportunityReply = ApiDataReply<Opportunity>;
export type CreateOpportunityBody = OpportunityCreateInput;
export type CreateOpportunityReply = ApiDataReply<Opportunity>;
export type UpdateOpportunityParams = GetOpportunityParams;
export type UpdateOpportunityBody = OpportunityUpdateInput;
export type UpdateOpportunityReply = ApiDataReply<Opportunity>;
export type DeleteOpportunityParams = GetOpportunityParams;

export const listOpportunities: RouteHandler<{
  Querystring: ListOpportunitiesQuery;
  Reply: ListOpportunitiesReply;
}> = async (request) => {
  const opportunities = await request.crmService.listOpportunities();

  const filtered = opportunities.filter((opportunity) => {
    if (request.query.stage && opportunity.stage !== request.query.stage) {
      return false;
    }

    if (request.query.accountId && opportunity.accountId !== request.query.accountId) {
      return false;
    }

    if (
      typeof request.query.minProbability === "number" &&
      opportunity.probability < request.query.minProbability
    ) {
      return false;
    }

    return true;
  });

  const offset = request.query.offset ?? 0;
  const limit = request.query.limit ?? filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  return { data: sliced };
};

export const getOpportunity: RouteHandler<{
  Params: GetOpportunityParams;
  Reply: GetOpportunityReply;
}> = async (request, reply) => {
  const opportunity = await request.crmService.getOpportunity(request.params.id);

  if (!opportunity) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Opportunity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return { data: opportunity };
};

export const createOpportunity: RouteHandler<{
  Body: CreateOpportunityBody;
  Reply: CreateOpportunityReply;
}> = async (request, reply) => {
  const opportunity = await request.crmService.createOpportunity(request.body);

  return reply.code(201).send({ data: opportunity });
};

export const updateOpportunity: RouteHandler<{
  Params: UpdateOpportunityParams;
  Body: UpdateOpportunityBody;
  Reply: UpdateOpportunityReply;
}> = async (request, reply) => {
  const updated = await request.crmService.updateOpportunity(request.params.id, request.body);

  if (!updated) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Opportunity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return { data: updated };
};

export const deleteOpportunity: RouteHandler<{
  Params: DeleteOpportunityParams;
  Reply: ApiReply<void>;
}> = async (request, reply) => {
  const deleted = await request.crmService.deleteOpportunity(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Opportunity ${request.params.id} not found`, { error: "Not Found" })
      );
  }

  return reply.status(204).send();
};

