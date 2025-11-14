import type {
	Quote,
	QuoteCreateInput,
	QuoteSortField,
	QuoteStatus,
	QuoteUpdateInput,
} from "@crm/types";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

type QuoteListFilters = {
	companyId?: string;
	contactId?: string;
	status?: QuoteStatus;
	search?: string;
	limit?: number;
	offset?: number;
	sortField?: QuoteSortField;
	sortOrder?: "asc" | "desc";
};

export const quoteKeys = {
	all: ["quotes"] as const,
	lists: () => [...quoteKeys.all, "list"] as const,
	list: (filters?: QuoteListFilters) =>
		filters ? ([...quoteKeys.lists(), filters] as const) : quoteKeys.lists(),
	details: () => [...quoteKeys.all, "detail"] as const,
	detail: (id: number) => [...quoteKeys.details(), id] as const,
	byCompany: (companyId: string) =>
		[...quoteKeys.lists(), { companyId }] as const,
	byContact: (contactId: string) =>
		[...quoteKeys.lists(), { contactId }] as const,
};

export type QuotesListResponse = {
	data: Quote[];
	total: number;
	limit: number;
	offset: number;
};

export async function fetchQuotes(
	filters?: QuoteListFilters,
): Promise<QuotesListResponse> {
	const params = new URLSearchParams();
	if (filters?.companyId) params.append("companyId", filters.companyId);
	if (filters?.contactId) params.append("contactId", filters.contactId);
	if (filters?.status) params.append("status", filters.status);
	if (filters?.search) params.append("search", filters.search);
	if (filters?.limit) params.append("limit", filters.limit.toString());
	if (filters?.offset) params.append("offset", filters.offset.toString());
	if (filters?.sortField) params.append("sortField", filters.sortField);
	if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

	const endpoint = params.toString()
		? `sales/quotes?${params.toString()}`
		: "sales/quotes";

	const response = await ensureResponse(fetch(getApiUrl(endpoint)));
	const payload = (await response.json()) as QuotesListResponse;
	return payload;
}

export async function fetchQuote(id: number): Promise<Quote> {
	const response = await ensureResponse(fetch(getApiUrl(`sales/quotes/${id}`)));
	const payload = (await response.json()) as { data: Quote };
	return payload.data;
}

export async function createQuote(input: QuoteCreateInput): Promise<Quote> {
	const response = await ensureResponse(
		fetch(getApiUrl("sales/quotes"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
	const payload = (await response.json()) as { data: Quote };
	return payload.data;
}

export async function updateQuote(
	id: number,
	input: QuoteUpdateInput,
): Promise<Quote> {
	const response = await ensureResponse(
		fetch(getApiUrl(`sales/quotes/${id}`), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
	const payload = (await response.json()) as { data: Quote };
	return payload.data;
}

export async function deleteQuote(id: number): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`sales/quotes/${id}`), {
			method: "DELETE",
		}),
	);
}
