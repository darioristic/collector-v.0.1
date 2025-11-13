import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  LeaveRequest,
  LeaveRequestCreateInput,
  LeaveRequestListFilters,
  LeaveRequestUpdateInput
} from "./leave-management.service";
import {
  leaveRequestApproveSchema,
  leaveRequestCreateSchema,
  leaveRequestDeleteSchema,
  leaveRequestGetSchema,
  leaveRequestListSchema,
  leaveRequestRejectSchema,
  leaveRequestUpdateSchema
} from "./leave-management.schema";

export type ListLeaveRequestsQuery = {
  employeeId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ListLeaveRequestsReply = ApiDataReply<LeaveRequest[]> & {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetLeaveRequestParams = { id: string };
export type GetLeaveRequestReply = ApiDataReply<LeaveRequest>;
export type CreateLeaveRequestBody = LeaveRequestCreateInput;
export type CreateLeaveRequestReply = ApiDataReply<LeaveRequest>;
export type UpdateLeaveRequestParams = GetLeaveRequestParams;
export type UpdateLeaveRequestBody = LeaveRequestUpdateInput;
export type UpdateLeaveRequestReply = ApiDataReply<LeaveRequest>;
export type DeleteLeaveRequestParams = GetLeaveRequestParams;
export type ApproveLeaveRequestParams = GetLeaveRequestParams;
export type ApproveLeaveRequestQuery = { approverId: string };
export type RejectLeaveRequestParams = GetLeaveRequestParams;
export type RejectLeaveRequestQuery = { approverId: string };

export const listLeaveRequests: RouteHandler<{
  Querystring: ListLeaveRequestsQuery;
  Reply: ListLeaveRequestsReply;
}> = async (request) => {
  const filters: LeaveRequestListFilters = {
    employeeId: request.query.employeeId,
    status: request.query.status,
    search: request.query.search,
    limit: request.query.limit,
    offset: request.query.offset
  };

  const result = await request.leaveManagementService.list(filters);

  return {
    data: result.data,
    pagination: result.pagination
  };
};

export const getLeaveRequest: RouteHandler<{
  Params: GetLeaveRequestParams;
  Reply: GetLeaveRequestReply;
}> = async (request, reply) => {
  const leaveRequest = await request.leaveManagementService.getById(request.params.id);

  if (!leaveRequest) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Leave request ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: leaveRequest };
};

export const createLeaveRequest: RouteHandler<{
  Body: CreateLeaveRequestBody;
  Reply: CreateLeaveRequestReply;
}> = async (request, reply) => {
  try {
    const leaveRequest = await request.leaveManagementService.create(request.body);
    return reply.status(201).send({ data: leaveRequest });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create leave request");
    return reply
      .status(500)
      .send(
        createHttpError(500, "Failed to create leave request", {
          error: "Internal Server Error"
        })
      );
  }
};

export const updateLeaveRequest: RouteHandler<{
  Params: UpdateLeaveRequestParams;
  Body: UpdateLeaveRequestBody;
  Reply: UpdateLeaveRequestReply;
}> = async (request, reply) => {
  const leaveRequest = await request.leaveManagementService.update(
    request.params.id,
    request.body
  );

  if (!leaveRequest) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Leave request ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: leaveRequest };
};

export const deleteLeaveRequest: RouteHandler<{
  Params: DeleteLeaveRequestParams;
}> = async (request, reply) => {
  const deleted = await request.leaveManagementService.delete(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Leave request ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

export const approveLeaveRequest: RouteHandler<{
  Params: ApproveLeaveRequestParams;
  Querystring: ApproveLeaveRequestQuery;
  Reply: ApiDataReply<LeaveRequest>;
}> = async (request, reply) => {
  const leaveRequest = await request.leaveManagementService.approve(
    request.params.id,
    request.query.approverId
  );

  if (!leaveRequest) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Leave request ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: leaveRequest };
};

export const rejectLeaveRequest: RouteHandler<{
  Params: RejectLeaveRequestParams;
  Querystring: RejectLeaveRequestQuery;
  Reply: ApiDataReply<LeaveRequest>;
}> = async (request, reply) => {
  const leaveRequest = await request.leaveManagementService.reject(
    request.params.id,
    request.query.approverId
  );

  if (!leaveRequest) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Leave request ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: leaveRequest };
};

