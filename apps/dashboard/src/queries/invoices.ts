import { ensureResponse } from "@/src/lib/fetch-utils";
import type { Invoice, InvoiceCreateInput, InvoiceUpdateInput } from "@crm/types";

type InvoicesListResponse = {
  data: Invoice[];
  total: number;
  limit: number;
  offset: number;
};

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters ? [...invoiceKeys.lists(), filters] as const : invoiceKeys.lists(),
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  byCustomer: (customerId: string) => [...invoiceKeys.lists(), { customerId }] as const,
  byOrder: (orderId: number) => [...invoiceKeys.lists(), { orderId }] as const
};

export async function fetchInvoices(filters?: {
  customerId?: string;
  orderId?: number;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<InvoicesListResponse> {
  const params = new URLSearchParams();
  if (filters?.customerId) params.append("customerId", filters.customerId);
  if (filters?.orderId) params.append("orderId", filters.orderId.toString());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const url = params.toString()
    ? `/api/sales/invoices?${params.toString()}`
    : "/api/sales/invoices";

  const response = await ensureResponse(await fetch(url));
  const payload = (await response.json()) as InvoicesListResponse;
  return payload;
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const response = await ensureResponse(await fetch(`/api/sales/invoices/${id}`));
  const payload = (await response.json()) as { data: Invoice };
  return payload.data;
}

export async function createInvoice(input: InvoiceCreateInput): Promise<Invoice> {
  const response = await ensureResponse(
    await fetch("/api/sales/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
  const payload = (await response.json()) as { data: Invoice };
  return payload.data;
}

export async function updateInvoice(id: string, input: InvoiceUpdateInput): Promise<Invoice> {
  const response = await ensureResponse(
    await fetch(`/api/sales/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
  const payload = (await response.json()) as { data: Invoice };
  return payload.data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await ensureResponse(
    await fetch(`/api/sales/invoices/${id}`, {
      method: "DELETE"
    })
  );
}