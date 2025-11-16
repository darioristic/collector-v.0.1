import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { InvoicesService } from "./invoices.service.js";
import { INVOICE_STATUSES, type InvoiceCreateInput, type InvoiceUpdateInput, type InvoiceStatus } from "@crm/types";
import { invoiceLinks } from "../../db/schema/sales.schema.js";
import { eventEmitter } from "../../lib/events/event-emitter.js";
import type { InvoiceSentEvent } from "../../lib/events/notification-events.js";
import type { AuthenticatedRequest } from "../../types/auth.js";

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

type SendInvoiceRequest = (FastifyRequest<{
  Params: { id: string };
  Body: {
    email?: string | string[];
    expiresInDays?: number;
  };
}> & AuthenticatedRequest);

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

type GetInvoiceByTokenRequest = FastifyRequest<{
  Params: { token: string };
}>;

type TrackInvoiceViewRequest = FastifyRequest<{
  Params: { token: string };
}>;

export const getInvoiceByTokenHandler = async (
  request: GetInvoiceByTokenRequest,
  reply: FastifyReply
) => {
  try {
    const { token } = request.params;
    const service = new InvoicesService(request.db, request.cache);

    // Find invoice link by token
    const [link] = await request.db
      .select()
      .from(invoiceLinks)
      .where(
        and(
          eq(invoiceLinks.token, token),
          or(
            isNull(invoiceLinks.expiresAt),
            gt(invoiceLinks.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    if (!link) {
      return reply.status(404).send({ error: "Invoice link not found or expired" });
    }

    // Get invoice
    const invoice = await service.getById(link.invoiceId);
    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    // Map invoice to template props format (similar to invoice-detail.tsx logic)
    // This should match the mapping in invoice-detail.tsx
    const defaultTemplate = {
      logo_url: undefined,
      from_label: "From",
      customer_label: "Bill To",
      description_label: "Description",
      quantity_label: "Quantity",
      price_label: "Price",
      total_label: "Total",
      vat_label: "VAT",
      payment_label: "Payment Details",
      note_label: "Note",
      include_vat: true,
      include_tax: false,
    };

    const lineItems = (invoice.items || []).map((item) => ({
      name: item.description || "Product / Service",
      price: Number(item.unitPrice),
      quantity: Number(item.quantity),
      vat: item.vatRate ? Number(item.vatRate) : undefined,
      unit: item.unit || undefined,
      discountRate: item.discountRate ? Number(item.discountRate) : undefined,
    }));

    function createEditorContent(text: string | null | undefined): JSON | undefined {
      if (!text) {
        return {
          type: "doc",
          content: [],
        } as JSON;
      }
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: text,
              },
            ],
          },
        ],
      } as JSON;
    }

    const fromDetails = createEditorContent(
      `Your Company\ninfo@yourcompany.com\n+381 60 000 0000\nAddress line\nVAT ID: —`
    );

    const customerDetails = createEditorContent(
      `${invoice.customerName}\n${invoice.customerEmail || ""}\n${invoice.billingAddress || ""}\nVAT ID: —`
    );

    const paymentDetails = createEditorContent("Bank: — | Account number: — | IBAN: —");

    const noteDetails = invoice.notes
      ? (typeof invoice.notes === "object"
        ? (invoice.notes as JSON)
        : createEditorContent(String(invoice.notes)))
      : undefined;

    const templateProps = {
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issuedAt,
      due_date: invoice.dueDate || null,
      template: defaultTemplate,
      line_items: lineItems,
      customer_details: customerDetails,
      from_details: fromDetails,
      payment_details: paymentDetails,
      note_details: noteDetails,
      currency: invoice.currency,
      customer_name: invoice.customerName,
      amountBeforeDiscount: Number(invoice.amountBeforeDiscount),
      discountTotal: Number(invoice.discountTotal),
      subtotal: Number(invoice.subtotal),
      totalVat: Number(invoice.totalVat),
      total: Number(invoice.total),
    };

    return reply.status(200).send({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        total: Number(invoice.total),
        currency: invoice.currency,
      },
      templateProps,
    });
  } catch (error) {
    request.log?.error(error, "Failed to fetch invoice by token");
    const message = error instanceof Error ? error.message : "Unknown error";
    return reply.status(500).send({ error: "Failed to fetch invoice", message });
  }
};

export const trackInvoiceViewHandler = async (
  request: TrackInvoiceViewRequest,
  reply: FastifyReply
) => {
  try {
    const { token } = request.params;

    // Find invoice link by token
    const [link] = await request.db
      .select()
      .from(invoiceLinks)
      .where(
        and(
          eq(invoiceLinks.token, token),
          or(
            isNull(invoiceLinks.expiresAt),
            gt(invoiceLinks.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    if (!link) {
      return reply.status(404).send({ error: "Invoice link not found or expired" });
    }

    // Update view tracking
    const now = new Date();
    await request.db
      .update(invoiceLinks)
      .set({
        viewCount: link.viewCount + 1,
        viewedAt: link.viewedAt || now,
      })
      .where(eq(invoiceLinks.id, link.id));

    return reply.status(200).send({ success: true });
  } catch (error) {
    request.log?.error(error, "Failed to track invoice view");
    const message = error instanceof Error ? error.message : "Unknown error";
    return reply.status(500).send({ error: "Failed to track view", message });
  }
};

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

    // Get user and company ID from request (from headers or authenticated user)
    const userId = request.user?.id || (request.headers["x-user-id"] as string | undefined) || "system";
    const companyId = request.user?.companyId || (request.headers["x-company-id"] as string | undefined) || invoice.companyId || "";

    // Emit invoice sent event (notification will be handled by event handler)
    const invoiceSentEvent: InvoiceSentEvent = {
      userId,
      companyId,
      invoiceId: id,
      invoiceNumber: invoice.invoiceNumber,
      recipientEmail: recipientEmails,
      invoiceLink,
      customerName: invoice.customerName || undefined,
      amount: invoice.totalAmount ? Number(invoice.totalAmount) : undefined,
      currency: invoice.currency || undefined,
      timestamp: new Date(),
      metadata: {
        invoiceId: id,
        token,
        expiresAt: expiresAt?.toISOString(),
      },
    };

    eventEmitter.emit("invoice.sent", invoiceSentEvent);

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