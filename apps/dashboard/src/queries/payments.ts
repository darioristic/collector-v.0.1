import type { Payment, PaymentCreateInput } from "@crm/types";
import { ensureResponse } from "@/src/lib/fetch-utils";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters ? [...paymentKeys.lists(), filters] as const : paymentKeys.lists(),
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  byInvoice: (invoiceId: string) => [...paymentKeys.lists(), { invoiceId }] as const
};

export type PaymentsListResponse = {
  data: Payment[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchPayments(filters?: {
  invoiceId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaymentsListResponse> {
  const params = new URLSearchParams();
  if (filters?.invoiceId) params.append("invoiceId", filters.invoiceId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const url = params.toString()
    ? `/api/sales/payments?${params.toString()}`
    : "/api/sales/payments";

  const response = await ensureResponse(await fetch(url));
  const payload = (await response.json()) as PaymentsListResponse;
  return payload;
}

export async function fetchPayment(id: string): Promise<Payment> {
  const response = await ensureResponse(await fetch(`/api/sales/payments/${id}`));
  const payload = (await response.json()) as { data: Payment };
  return payload.data;
}

export async function createPayment(input: PaymentCreateInput): Promise<Payment> {
  const response = await ensureResponse(
    await fetch("/api/sales/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
  const payload = (await response.json()) as { data: Payment };
  return payload.data;
}

export async function deletePayment(id: string): Promise<void> {
  await ensureResponse(
    await fetch(`/api/sales/payments/${id}`, {
      method: "DELETE"
    })
  );
}