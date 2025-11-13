import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  Candidate,
  CandidateCreateInput,
  CandidateListFilters,
  CandidateUpdateInput,
  Interview,
  InterviewCreateInput,
  InterviewListFilters,
  InterviewUpdateInput
} from "./recruitment.service";
import {
  candidateCreateSchema,
  candidateDeleteSchema,
  candidateGetSchema,
  candidateListSchema,
  candidateUpdateSchema,
  interviewCreateSchema,
  interviewDeleteSchema,
  interviewGetSchema,
  interviewListSchema,
  interviewUpdateSchema
} from "./recruitment.schema";

// Candidate types
export type ListCandidatesQuery = {
  status?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  position?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ListCandidatesReply = ApiDataReply<Candidate[]> & {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetCandidateParams = { id: string };
export type GetCandidateReply = ApiDataReply<Candidate>;
export type CreateCandidateBody = CandidateCreateInput;
export type CreateCandidateReply = ApiDataReply<Candidate>;
export type UpdateCandidateParams = GetCandidateParams;
export type UpdateCandidateBody = CandidateUpdateInput;
export type UpdateCandidateReply = ApiDataReply<Candidate>;
export type DeleteCandidateParams = GetCandidateParams;

// Interview types
export type ListInterviewsQuery = {
  candidateId?: string;
  interviewerId?: string;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  limit?: number;
  offset?: number;
};

export type ListInterviewsReply = ApiDataReply<Interview[]> & {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetInterviewParams = { id: string };
export type GetInterviewReply = ApiDataReply<Interview>;
export type CreateInterviewBody = InterviewCreateInput;
export type CreateInterviewReply = ApiDataReply<Interview>;
export type UpdateInterviewParams = GetInterviewParams;
export type UpdateInterviewBody = InterviewUpdateInput;
export type UpdateInterviewReply = ApiDataReply<Interview>;
export type DeleteInterviewParams = GetInterviewParams;

// Candidate handlers
export const listCandidates: RouteHandler<{
  Querystring: ListCandidatesQuery;
  Reply: ListCandidatesReply;
}> = async (request) => {
  const filters: CandidateListFilters = {
    status: request.query.status,
    position: request.query.position,
    search: request.query.search,
    limit: request.query.limit,
    offset: request.query.offset
  };

  const result = await request.recruitmentService.listCandidates(filters);

  return {
    data: result.data,
    pagination: result.pagination
  };
};

export const getCandidate: RouteHandler<{
  Params: GetCandidateParams;
  Reply: GetCandidateReply;
}> = async (request, reply) => {
  const candidate = await request.recruitmentService.getCandidateById(request.params.id);

  if (!candidate) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Candidate ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: candidate };
};

export const createCandidate: RouteHandler<{
  Body: CreateCandidateBody;
  Reply: CreateCandidateReply;
}> = async (request, reply) => {
  try {
    const candidate = await request.recruitmentService.createCandidate(request.body);
    return reply.status(201).send({ data: candidate });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create candidate");
    return reply
      .status(500)
      .send(
        createHttpError(500, "Failed to create candidate", {
          error: "Internal Server Error"
        })
      );
  }
};

export const updateCandidate: RouteHandler<{
  Params: UpdateCandidateParams;
  Body: UpdateCandidateBody;
  Reply: UpdateCandidateReply;
}> = async (request, reply) => {
  const candidate = await request.recruitmentService.updateCandidate(
    request.params.id,
    request.body
  );

  if (!candidate) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Candidate ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: candidate };
};

export const deleteCandidate: RouteHandler<{
  Params: DeleteCandidateParams;
}> = async (request, reply) => {
  const deleted = await request.recruitmentService.deleteCandidate(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Candidate ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

// Interview handlers
export const listInterviews: RouteHandler<{
  Querystring: ListInterviewsQuery;
  Reply: ListInterviewsReply;
}> = async (request) => {
  const filters: InterviewListFilters = {
    candidateId: request.query.candidateId,
    interviewerId: request.query.interviewerId,
    status: request.query.status,
    limit: request.query.limit,
    offset: request.query.offset
  };

  const result = await request.recruitmentService.listInterviews(filters);

  return {
    data: result.data,
    pagination: result.pagination
  };
};

export const getInterview: RouteHandler<{
  Params: GetInterviewParams;
  Reply: GetInterviewReply;
}> = async (request, reply) => {
  const interview = await request.recruitmentService.getInterviewById(request.params.id);

  if (!interview) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Interview ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: interview };
};

export const createInterview: RouteHandler<{
  Body: CreateInterviewBody;
  Reply: CreateInterviewReply;
}> = async (request, reply) => {
  try {
    const interview = await request.recruitmentService.createInterview(request.body);
    return reply.status(201).send({ data: interview });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create interview");
    return reply
      .status(500)
      .send(
        createHttpError(500, "Failed to create interview", {
          error: "Internal Server Error"
        })
      );
  }
};

export const updateInterview: RouteHandler<{
  Params: UpdateInterviewParams;
  Body: UpdateInterviewBody;
  Reply: UpdateInterviewReply;
}> = async (request, reply) => {
  const interview = await request.recruitmentService.updateInterview(
    request.params.id,
    request.body
  );

  if (!interview) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Interview ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: interview };
};

export const deleteInterview: RouteHandler<{
  Params: DeleteInterviewParams;
}> = async (request, reply) => {
  const deleted = await request.recruitmentService.deleteInterview(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Interview ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

