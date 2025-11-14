import type {
	Order,
	OrderCreateInput,
	OrderStatus,
	OrderUpdateInput,
} from "@crm/types";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

type OrderListFilters = {
	companyId?: string;
	contactId?: string;
	quoteId?: number;
	status?: OrderStatus;
	search?: string;
	limit?: number;
	offset?: number;
};

type OrdersListResponse = {
	data: Order[];
	total: number;
	limit: number;
	offset: number;
};

export const orderKeys = {
	all: ["orders"] as const,
	lists: () => [...orderKeys.all, "list"] as const,
	list: (filters?: OrderListFilters) =>
		filters ? ([...orderKeys.lists(), filters] as const) : orderKeys.lists(),
	details: () => [...orderKeys.all, "detail"] as const,
	detail: (id: number) => [...orderKeys.details(), id] as const,
	byCompany: (companyId: string) =>
		[...orderKeys.lists(), { companyId }] as const,
	byContact: (contactId: string) =>
		[...orderKeys.lists(), { contactId }] as const,
	byQuote: (quoteId: number) => [...orderKeys.lists(), { quoteId }] as const,
};

export async function fetchOrders(filters?: OrderListFilters): Promise<OrdersListResponse> {
	const params = new URLSearchParams();
	if (filters?.companyId) params.append("companyId", filters.companyId);
	if (filters?.contactId) params.append("contactId", filters.contactId);
	if (filters?.quoteId) params.append("quoteId", filters.quoteId.toString());
	if (filters?.status) params.append("status", filters.status);
	if (filters?.search) params.append("search", filters.search);
	if (filters?.limit) params.append("limit", filters.limit.toString());
	if (filters?.offset) params.append("offset", filters.offset.toString());

	const endpoint = params.toString()
		? `sales/orders?${params.toString()}`
		: "sales/orders";

	const response = await ensureResponse(fetch(getApiUrl(endpoint)));
	const payload = (await response.json()) as OrdersListResponse;
	return payload;
}

export async function fetchOrder(id: number): Promise<Order> {
	const response = await ensureResponse(fetch(getApiUrl(`sales/orders/${id}`)));
	const payload = (await response.json()) as { data: Order };
	return payload.data;
}

export async function createOrder(input: OrderCreateInput): Promise<Order> {
	const response = await ensureResponse(
		fetch(getApiUrl("sales/orders"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
	const payload = (await response.json()) as { data: Order };
	return payload.data;
}

export async function updateOrder(
	id: number,
	input: OrderUpdateInput,
): Promise<Order> {
	const response = await ensureResponse(
		fetch(getApiUrl(`sales/orders/${id}`), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
	);
	const payload = (await response.json()) as { data: Order };
	return payload.data;
}

export async function deleteOrder(id: number): Promise<void> {
	await ensureResponse(
		fetch(getApiUrl(`sales/orders/${id}`), {
			method: "DELETE",
		}),
	);
}
