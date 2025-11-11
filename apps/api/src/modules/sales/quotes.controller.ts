import type { FastifyReply, FastifyRequest } from "fastify";
import { QuotesService } from "./quotes.service.js";
import type { QuoteCreateInput, QuoteSortField, QuoteUpdateInput } from "@crm/types";

type ListRequest = FastifyRequest<{
  Querystring: {
    companyId?: string;
    contactId?: string;
    status?: string;
    search?: string;
    limit?: string;
    offset?: string;
    sortField?: QuoteSortField;
    sortOrder?: "asc" | "desc";
  };
}>;

type GetRequest = FastifyRequest<{
  Params: { id: string };
}>;

type CreateRequest = FastifyRequest<{
  Body: QuoteCreateInput;
}>;

type UpdateRequest = FastifyRequest<{
  Params: { id: string };
  Body: QuoteUpdateInput;
}>;

type DeleteRequest = FastifyRequest<{
  Params: { id: string };
}>;

export const listQuotesHandler = async (request: ListRequest, reply: FastifyReply) => {
  const service = new QuotesService(request.db, request.cache);
  const filters = {
    companyId: request.query.companyId,
    contactId: request.query.contactId,
    status: request.query.status as any,
    search: request.query.search,
    limit: request.query.limit ? Number.parseInt(request.query.limit, 10) : undefined,
    offset: request.query.offset ? Number.parseInt(request.query.offset, 10) : undefined,
    sortField: request.query.sortField,
    sortOrder: request.query.sortOrder
  };

  const result = await service.list(filters);

  await reply.status(200).send({
    data: result.data,
    total: result.total,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0
  });
};

export const getQuoteHandler = async (request: GetRequest, reply: FastifyReply) => {
  const service = new QuotesService(request.db, request.cache);
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid quote ID" });
  }

  const quote = await service.getById(id);

  if (!quote) {
    return reply.status(404).send({ error: "Quote not found" });
  }

  await reply.status(200).send({ data: quote });
};

export const createQuoteHandler = async (request: CreateRequest, reply: FastifyReply) => {
  const service = new QuotesService(request.db, request.cache);
  const quote = await service.create(request.body);
  await reply.status(201).send({ data: quote });
};

export const updateQuoteHandler = async (request: UpdateRequest, reply: FastifyReply) => {
  const service = new QuotesService(request.db, request.cache);
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid quote ID" });
  }

  const quote = await service.update(id, request.body);

  if (!quote) {
    return reply.status(404).send({ error: "Quote not found" });
  }

  await reply.status(200).send({ data: quote });
};

export const deleteQuoteHandler = async (request: DeleteRequest, reply: FastifyReply) => {
  const service = new QuotesService(request.db, request.cache);
  const id = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(id)) {
    return reply.status(400).send({ error: "Invalid quote ID" });
  }

  const deleted = await service.delete(id);

  if (!deleted) {
    return reply.status(404).send({ error: "Quote not found" });
  }

  await reply.status(204).send();
};