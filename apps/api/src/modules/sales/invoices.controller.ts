import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { InvoicesService } from "./invoices.service.js";
import { INVOICE_STATUSES, type InvoiceCreateInput, type InvoiceUpdateInput, type InvoiceStatus } from "@crm/types";
import { invoiceLinks } from "../../db/schema/sales.schema.js";
import { emailService } from "../../lib/email.service.js";

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

type SendInvoiceRequest = FastifyRequest<{
  Params: { id: string };
  Body: {
    email?: string | string[];
    expiresInDays?: number;
  };
}>;

export const listInvoicesHandler = async (request: ListRequest, reply: FastifyReply) => {
  const service = new InvoicesService(request.db, request.cache);
  const status =
    request.query.status && (INVOICE_STATUSES as readonly string[]).includes(request.query.status as InvoiceStatus)
      ? (request.query.status as InvoiceStatus)
      : undefined;

  const filters = {
    customerId: request.query.customerId,
    orderId: request.query.orderId ? Number.parseInt(request.query.orderId, 10) : undefined,
    status,
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
  try {
    const service = new InvoicesService(request.db, request.cache);
    const { id } = request.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({ error: "Invalid invoice ID format" });
    }

    const invoice = await service.getById(id);

    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    await reply.status(200).send({ data: invoice });
  } catch (error) {
    request.log?.error(error, "Failed to fetch invoice");
    const message = error instanceof Error ? error.message : "Unknown error";
    await reply.status(500).send({ error: "Failed to fetch invoice", message });
  }
};

export const createInvoiceHandler = async (request: CreateRequest, reply: FastifyReply) => {
  const service = new InvoicesService(request.db, request.cache);
  const invoice = await service.create(request.body);
  await reply.status(201).send({ data: invoice });
};

export const updateInvoiceHandler = async (request: UpdateRequest, reply: FastifyReply) => {
  const service = new InvoicesService(request.db, request.cache);
  const { id } = request.params;

  const invoice = await service.update(id, request.body);

  if (!invoice) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  await reply.status(200).send({ data: invoice });
};

export const deleteInvoiceHandler = async (request: DeleteRequest, reply: FastifyReply) => {
  const service = new InvoicesService(request.db, request.cache);
  const { id } = request.params;

  const deleted = await service.delete(id);

  if (!deleted) {
    return reply.status(404).send({ error: "Invoice not found" });
  }

  await reply.status(204).send();
};

/**
 * Generate a secure random token for invoice link
 */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export const sendInvoiceHandler = async (request: SendInvoiceRequest, reply: FastifyReply) => {
  try {
    const service = new InvoicesService(request.db, request.cache);
    const { id } = request.params;
    const { email, expiresInDays = 30 } = request.body;

    // Get invoice
    const invoice = await service.getById(id);
    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    // Determine recipient email(s)
    const recipientEmails = email || invoice.customerEmail;
    if (!recipientEmails) {
      return reply.status(400).send({ error: "No email address provided" });
    }

    // Generate unique token
    const token = generateToken();

    // Calculate expiration date
    const expiresAt = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create invoice link record
    await request.db.insert(invoiceLinks).values({
      invoiceId: id,
      token,
      expiresAt,
      viewCount: 0,
    });

    // Generate invoice link URL
    const baseUrl = process.env.PUBLIC_URL || process.env.API_URL || "http://localhost:3000";
    const invoiceLink = `${baseUrl}/invoices/${token}`;

    // Send email
    await emailService.sendInvoiceLink({
      to: recipientEmails,
      invoiceNumber: invoice.invoiceNumber,
      invoiceLink,
      customerName: invoice.customerName,
    });

    await reply.status(200).send({
      data: {
        token,
        link: invoiceLink,
        expiresAt: expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    request.log?.error(error, "Failed to send invoice");
    const message = error instanceof Error ? error.message : "Unknown error";
    await reply.status(500).send({ error: "Failed to send invoice", message });
  }
};