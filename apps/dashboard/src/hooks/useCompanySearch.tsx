"use client";

import type { Account } from "@crm/types";
import { useQuery } from "@tanstack/react-query";
import { ensureResponse } from "@/src/lib/fetch-utils";
import { useDebounce } from "./useDebounce";

async function searchCompanies(query: string): Promise<Account[]> {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const searchParams = new URLSearchParams({ search: query.trim() });
	const response = await ensureResponse(
		fetch(`/api/accounts?${searchParams.toString()}`, {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);

	const accounts = (await response.json()) as Account[];
	return accounts;
}

export function useCompanySearch(searchQuery: string) {
	const debouncedQuery = useDebounce(searchQuery, 200);

	return useQuery({
		queryKey: ["companies", "search", debouncedQuery],
		queryFn: () => searchCompanies(debouncedQuery),
		enabled: debouncedQuery.trim().length >= 2,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
