"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

function getQueryClient(): QueryClient {
	const g = globalThis as unknown as { __collectorQC?: QueryClient };
	if (g.__collectorQC) return g.__collectorQC;
	const qc = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				refetchOnWindowFocus: false,
			},
			mutations: {
				networkMode: "online",
			},
		},
	});
	g.__collectorQC = qc;
	return qc;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useMemo(() => getQueryClient(), []);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
