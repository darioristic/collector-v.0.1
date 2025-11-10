import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/index.js";
import { OrdersService } from "./orders.service.js";
import type { OrderCreateInput, OrderUpdateInput } from "@crm/types";

const service = new OrdersService(db);

type ListRequest = FastifyRequest<{
  Querystring: {
    companyId?: string;
    contactId?: string;
    quoteId?: string;
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
  Body: OrderCreateInput;
}>;

type UpdateRequest = FastifyRequest<{
  Params: { id: string };
  Body: OrderUpdateInput;
}>;

type DeleteRequest = FastifyRequest<{
  Params: { id: string };
}>;

export const listOrdersHandler = async (request: ListRequest, reply: FastifyReply) => {
  const filters = {
    companyId: request.query.companyId,
    contactId: request.query.contactId,
    quoteId: request.query.quoteId ? Number.parseInt(request.query.quoteId, 10) : undefined,
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

export const getOrderHandler = async (request: GetRequest, reply: FastifyReply) => {
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid order ID" });
  }

  const order = await service.getById(id);

  if (!order) {
    return reply.status(404).send({ error: "Order not found" });
  }

  await reply.status(200).send({ data: order });
};

export const createOrderHandler = async (request: CreateRequest, reply: FastifyReply) => {
  const order = await service.create(request.body);
  await reply.status(201).send({ data: order });
};

export const updateOrderHandler = async (request: UpdateRequest, reply: FastifyReply) => {
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid order ID" });
  }

  const order = await service.update(id, request.body);

  if (!order) {
    return reply.status(404).send({ error: "Order not found" });
  }

  await reply.status(200).send({ data: order });
};

export const deleteOrderHandler = async (request: DeleteRequest, reply: FastifyReply) => {
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid order ID" });
  }

  const deleted = await service.delete(id);

  if (!deleted) {
    return reply.status(404).send({ error: "Order not found" });
  }

  await reply.status(204).send();
};
