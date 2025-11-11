import type { FastifyReply, FastifyRequest } from "fastify";
import { PaymentsService } from "./payments.service.js";
import type { PaymentCreateBody, PaymentIdParams } from "./payments.schema.js";

type ListRequest = FastifyRequest<{
  Querystring: {
    invoiceId?: string;
    status?: string;
    limit?: string;
    offset?: string;
  };
}>;
type GetRequest = FastifyRequest<{ Params: PaymentIdParams }>;
type CreateRequest = FastifyRequest<{ Body: PaymentCreateBody }>;
type DeleteRequest = FastifyRequest<{ Params: PaymentIdParams }>;

export const listPaymentsHandler = async (request: ListRequest, reply: FastifyReply) => {
  const service = new PaymentsService(request.db);
  const filters = {
    invoiceId: request.query.invoiceId,
    status: request.query.status as any,
    limit: request.query.limit ? Number(request.query.limit) : undefined,
    offset: request.query.offset ? Number(request.query.offset) : undefined
  };

  const result = await service.list(filters);
  await reply.status(200).send({
    data: result.data,
    total: result.total,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0
  });
};

export const getPaymentHandler = async (request: GetRequest, reply: FastifyReply) => {
  const service = new PaymentsService(request.db);
  const payment = await service.getById(request.params.id);

  if (!payment) {
    await reply.status(404).send({
      message: "Payment not found"
    });
    return;
  }

  await reply.status(200).send({ data: payment });
};

export const createPaymentHandler = async (request: CreateRequest, reply: FastifyReply) => {
  const service = new PaymentsService(request.db);
  try {
    const payment = await service.create(request.body);
    await reply.status(201).send({ data: payment });
  } catch (error) {
    await reply.status(400).send({
      message: error instanceof Error ? error.message : "Failed to create payment"
    });
  }
};

export const deletePaymentHandler = async (request: DeleteRequest, reply: FastifyReply) => {
  const service = new PaymentsService(request.db);
  try {
    await service.delete(request.params.id);
    await reply.status(204).send();
  } catch (error) {
    await reply.status(404).send({
      message: error instanceof Error ? error.message : "Payment not found"
    });
  }
};