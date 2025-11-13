import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";
import type {
  PayrollEntry,
  PayrollEntryCreateInput,
  PayrollEntryListFilters,
  PayrollEntryUpdateInput
} from "./payroll.service";
import {
  payrollEntryCreateSchema,
  payrollEntryDeleteSchema,
  payrollEntryGetSchema,
  payrollEntryListSchema,
  payrollEntryUpdateSchema
} from "./payroll.schema";

export type ListPayrollEntriesQuery = {
  employeeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ListPayrollEntriesReply = ApiDataReply<PayrollEntry[]> & {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type GetPayrollEntryParams = { id: string };
export type GetPayrollEntryReply = ApiDataReply<PayrollEntry>;
export type CreatePayrollEntryBody = PayrollEntryCreateInput;
export type CreatePayrollEntryReply = ApiDataReply<PayrollEntry>;
export type UpdatePayrollEntryParams = GetPayrollEntryParams;
export type UpdatePayrollEntryBody = PayrollEntryUpdateInput;
export type UpdatePayrollEntryReply = ApiDataReply<PayrollEntry>;
export type DeletePayrollEntryParams = GetPayrollEntryParams;

export const listPayrollEntries: RouteHandler<{
  Querystring: ListPayrollEntriesQuery;
  Reply: ListPayrollEntriesReply;
}> = async (request) => {
  const filters: PayrollEntryListFilters = {
    employeeId: request.query.employeeId,
    search: request.query.search,
    limit: request.query.limit,
    offset: request.query.offset
  };

  const result = await request.payrollService.list(filters);

  return {
    data: result.data,
    pagination: result.pagination
  };
};

export const getPayrollEntry: RouteHandler<{
  Params: GetPayrollEntryParams;
  Reply: GetPayrollEntryReply;
}> = async (request, reply) => {
  const entry = await request.payrollService.getById(request.params.id);

  if (!entry) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Payroll entry ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: entry };
};

export const createPayrollEntry: RouteHandler<{
  Body: CreatePayrollEntryBody;
  Reply: CreatePayrollEntryReply;
}> = async (request, reply) => {
  try {
    const entry = await request.payrollService.create(request.body);
    return reply.status(201).send({ data: entry });
  } catch (error) {
    request.log.error({ err: error }, "Failed to create payroll entry");
    return reply
      .status(500)
      .send(
        createHttpError(500, "Failed to create payroll entry", {
          error: "Internal Server Error"
        })
      );
  }
};

export const updatePayrollEntry: RouteHandler<{
  Params: UpdatePayrollEntryParams;
  Body: UpdatePayrollEntryBody;
  Reply: UpdatePayrollEntryReply;
}> = async (request, reply) => {
  const entry = await request.payrollService.update(request.params.id, request.body);

  if (!entry) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Payroll entry ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return { data: entry };
};

export const deletePayrollEntry: RouteHandler<{
  Params: DeletePayrollEntryParams;
}> = async (request, reply) => {
  const deleted = await request.payrollService.delete(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(
        createHttpError(404, `Payroll entry ${request.params.id} not found`, {
          error: "Not Found"
        })
      );
  }

  return reply.status(204).send();
};

