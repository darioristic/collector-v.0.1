import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

export type Invoice = {
  id: string;
  orderId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
};

const invoicesStore: Invoice[] = [
  {
    id: "inv_001",
    orderId: "order_001",
    issueDate: new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 27 * 86_400_000).toISOString().slice(0, 10),
    amount: 50 * 1_950 + 28_500,
    status: "sent"
  },
  {
    id: "inv_002",
    orderId: "order_002",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
    amount: 20 * 1_850,
    status: "draft"
  }
];

export type ListInvoicesReply = { data: Invoice[] };
export type CreateInvoiceBody = Omit<Invoice, "id">;
export type CreateInvoiceReply = { data: Invoice };

export const listInvoicesHandler: RouteHandler<{ Reply: ListInvoicesReply }> = async () => {
  return { data: invoicesStore };
};

export const createInvoiceHandler: RouteHandler<{
  Body: CreateInvoiceBody;
  Reply: CreateInvoiceReply;
}> = async (request, reply) => {
  const newInvoice: Invoice = {
    id: randomUUID(),
    ...request.body
  };

  invoicesStore.push(newInvoice);

  reply.code(201);
  return { data: newInvoice };
};

export const mockInvoices = invoicesStore;


