"use client";

import { usePathname } from "next/navigation";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from "nuqs";

type UseInvoiceParamsOptions = {
	shallow?: boolean;
};

export function useInvoiceParams(options: UseInvoiceParamsOptions = {}) {
	const { shallow = true } = options;
	const pathname = usePathname();

	// Determine if we're in create or update mode based on pathname
	const isUpdatePage =
		pathname?.includes("/invoices/") && pathname?.split("/").length > 3;
	const type = isUpdatePage ? ("update" as const) : ("create" as const);

	// Search params for invoice list page
	const [searchParams, setSearchParams] = useQueryStates(
		{
			q: parseAsString.withDefault(""),
			page: parseAsInteger.withDefault(0),
			sort: parseAsArrayOf(parseAsString).withDefault(["createdAt", "desc"]),
			start: parseAsString,
			end: parseAsString,
			statuses: parseAsArrayOf(
				parseAsStringEnum(["draft", "pending", "overdue", "paid", "canceled"]),
			),
			customers: parseAsArrayOf(parseAsString),
			customer: parseAsString, // For invoice form - selected customer
			invoiceId: parseAsString, // For invoice form - draft invoice ID
			type: parseAsStringEnum(["create", "edit", "details", "comments"]), // For invoice form - type
		},
		{
			shallow,
			history: "push",
		},
	);

	// Extract sort as tuple
	const sort =
		searchParams.sort && searchParams.sort.length >= 2
			? ([searchParams.sort[0], searchParams.sort[1]] as [string, string])
			: null;

	// Helper function to set params
	const setParams = (params: {
		q?: string | null;
		page?: number | null;
		sort?: [string, string] | null;
		start?: string | null;
		end?: string | null;
		statuses?: string[] | null;
		customers?: string[] | null;
		customer?: string | null;
		invoiceId?: string | null;
		type?: "create" | "edit" | "details" | "comments" | null;
	}) => {
		setSearchParams((prev) => {
			const newParams: Record<string, any> = { ...prev };

			if (params.q !== undefined) {
				newParams.q = params.q ?? "";
			}
			if (params.page !== undefined) {
				newParams.page = params.page ?? 0;
			}
			if (params.sort !== undefined) {
				newParams.sort = params.sort ? params.sort : ["createdAt", "desc"];
			}
			if (params.start !== undefined) {
				newParams.start = params.start ?? null;
			}
			if (params.end !== undefined) {
				newParams.end = params.end ?? null;
			}
			if (params.statuses !== undefined) {
				newParams.statuses = params.statuses ?? null;
			}
			if (params.customers !== undefined) {
				newParams.customers = params.customers ?? null;
			}
			if (params.customer !== undefined) {
				newParams.customer = params.customer ?? null;
			}
			if (params.invoiceId !== undefined) {
				newParams.invoiceId = params.invoiceId ?? null;
			}
			if (params.type !== undefined) {
				newParams.type = params.type ?? null;
			}

			return newParams;
		});
	};

	return {
		// Search params
		q: searchParams.q || null,
		page: searchParams.page,
		sort,
		start: searchParams.start || null,
		end: searchParams.end || null,
		statuses: searchParams.statuses || null,
		customers: searchParams.customers || null,
		selectedCustomerId: searchParams.customer || null,
		invoiceId: searchParams.invoiceId || null,

		// Helper functions
		setParams,

		// Page type - use from params if available, otherwise determine from pathname
		type: (searchParams.type as "create" | "edit" | "details" | "comments") || type,
	};
}
