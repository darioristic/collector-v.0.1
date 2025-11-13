"use client";

import { useQuery } from "@tanstack/react-query";
import type { Account } from "@crm/types";
import { ensureResponse } from "@/src/lib/fetch-utils";

async function fetchAccounts(): Promise<Account[]> {
	const response = await ensureResponse(
		fetch("/api/accounts", {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);

	return (await response.json()) as Account[];
}

export function useAccounts() {
	return useQuery({
		queryKey: ["accounts"],
		queryFn: fetchAccounts,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

