import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/index.js";
import { InvoicesService } from "./invoices.service.js";
import type { InvoiceCreateInput, InvoiceUpdateInput } from "@crm/types";

const service = new InvoicesService(db);

type ListRequest = FastifyRequest<{
  Querystring: {
    customerId?: string;
    orderId?: string;
    status?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}>;

type GetRequest = FastifyRequest<{
  Params: { id: string };
}>;

type CreateRequest = FastifyRequest<{
  Body: InvoiceCreateInput;
}>;

type UpdateRequest = FastifyRequest<{
  Params: { id: string };
  Body: InvoiceUpdateInput;
}>;

type DeleteRequest = FastifyRequest<{
  Params: { id: string };
}>;

export const listInvoicesHandler = async (request: ListRequest, reply: FastifyReply) => {
  const filters = {
    customerId: request.query.customerId,
    orderId: request.query.orderId ? Number.parseInt(request.query.orderId, 10) : undefined,
    status: request.query.status,
    search: request.query.search,
    limit: request.query.limit ? Number.parseInt(request.query.limit, 10) : undefined,
    offset: request.query.offset ? Number.parseInt(request.query.offset, 10) : undefined
  };

  const result = await service.list(filters);

  await reply.status(200).send({
    data: result.data,
    total: result.total,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0
  });
};

export const getInvoiceHandler = async (request: GetRequest, reply: FastifyReply) => {
  const { id } = request.params;

  const invoice = await service.getById(id);

  if (!invoice) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  await reply.status(200).send({ data: invoice });
};

export const createInvoiceHandler = async (request: CreateRequest, reply: FastifyReply) => {
  const invoice = await service.create(request.body);
  await reply.status(201).send({ data: invoice });
};

export const updateInvoiceHandler = async (request: UpdateRequest, reply: FastifyReply) => {
  const { id } = request.params;

  const invoice = await service.update(id, request.body);

  if (!invoice) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  await reply.status(200).send({ data: invoice });
};

export const deleteInvoiceHandler = async (request: DeleteRequest, reply: FastifyReply) => {
  const { id } = request.params;

  const deleted = await service.delete(id);

  if (!deleted) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  await reply.status(204).send();
};