"use client";

import type { AccountContact } from "@crm/types";
import { useQuery } from "@tanstack/react-query";
import { ensureResponse } from "@/src/lib/fetch-utils";

async function fetchContacts(): Promise<AccountContact[]> {
	const response = await ensureResponse(
		fetch("/api/accounts/contacts", {
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		}),
	);

	return (await response.json()) as AccountContact[];
}

export function useContacts() {
	return useQuery({
		queryKey: ["contacts"],
		queryFn: fetchContacts,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
