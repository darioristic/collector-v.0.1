import type { Quote, QuoteCreateInput, QuoteUpdateInput } from "@crm/types";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

export const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    filters ? [...quoteKeys.lists(), filters] as const : quoteKeys.lists(),
  details: () => [...quoteKeys.all, "detail"] as const,
  detail: (id: number) => [...quoteKeys.details(), id] as const,
  byCompany: (companyId: string) => [...quoteKeys.lists(), { companyId }] as const,
  byContact: (contactId: string) => [...quoteKeys.lists(), { contactId }] as const
};

export type QuotesListResponse = {
  data: Quote[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchQuotes(filters?: {
  companyId?: string;
  contactId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<QuotesListResponse> {
  const params = new URLSearchParams();
  if (filters?.companyId) params.append("companyId", filters.companyId);
  if (filters?.contactId) params.append("contactId", filters.contactId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const endpoint = params.toString()
    ? `sales/quotes?${params.toString()}`
    : "sales/quotes";

  const response = await ensureResponse(await fetch(getApiUrl(endpoint)));
  const payload = (await response.json()) as QuotesListResponse;
  return payload;
}

export async function fetchQuote(id: number): Promise<Quote> {
  const response = await ensureResponse(await fetch(getApiUrl(`sales/quotes/${id}`)));
  const payload = (await response.json()) as { data: Quote };
  return payload.data;
}

export async function createQuote(input: QuoteCreateInput): Promise<Quote> {
  const response = await ensureResponse(
    await fetch(getApiUrl("sales/quotes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
  const payload = (await response.json()) as { data: Quote };
  return payload.data;
}

export async function updateQuote(id: number, input: QuoteUpdateInput): Promise<Quote> {
  const response = await ensureResponse(
    await fetch(getApiUrl(`sales/quotes/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
  const payload = (await response.json()) as { data: Quote };
  return payload.data;
}

export async function deleteQuote(id: number): Promise<void> {
  await ensureResponse(
    await fetch(getApiUrl(`sales/quotes/${id}`), {
      method: "DELETE"
    })
  );
}