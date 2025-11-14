"use client";

import type {
	QuoteCreateInput,
	QuoteSortField,
	QuoteUpdateInput,
} from "@crm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import {
	createQuote,
	deleteQuote,
	fetchQuote,
	fetchQuotes,
	quoteKeys,
	updateQuote,
} from "@/src/queries/quotes";

type UseQuotesOptions = {
	companyId?: string;
	contactId?: string;
	status?: string;
	search?: string;
	limit?: number;
	offset?: number;
	sortField?: QuoteSortField;
	sortOrder?: "asc" | "desc";
};

export function useQuotes(options: UseQuotesOptions = {}) {
	return useQuery({
		queryKey: quoteKeys.list(options),
		queryFn: () => fetchQuotes(options),
	});
}

export function useQuotesByCompany(companyId: string) {
	return useQuery({
		queryKey: quoteKeys.byCompany(companyId),
		queryFn: () => fetchQuotes({ companyId }),
		enabled: Boolean(companyId),
	});
}

export function useQuotesByContact(contactId: string) {
	return useQuery({
		queryKey: quoteKeys.byContact(contactId),
		queryFn: () => fetchQuotes({ contactId }),
		enabled: Boolean(contactId),
	});
}

export function useQuote(id: number, options: { enabled?: boolean } = {}) {
	return useQuery({
		queryKey: quoteKeys.detail(id),
		queryFn: () => fetchQuote(id),
		enabled: options.enabled ?? Boolean(id),
	});
}

export function useCreateQuote() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (input: QuoteCreateInput) => createQuote(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
			toast({
				title: "Quote created",
				description: "The quote has been created successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Creation failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to create the quote.",
			});
		},
	});
}

export function useUpdateQuote() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: number;
			input: QuoteUpdateInput;
		}) => updateQuote(id, input),
		onSuccess: async (quote) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: quoteKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quote.id) }),
			]);
			toast({
				title: "Quote updated",
				description: "The quote has been updated successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Update failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to update the quote.",
			});
		},
	});
}

export function useDeleteQuote() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (id: number) => deleteQuote(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
			toast({
				title: "Quote deleted",
				description: "The quote has been removed.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Delete failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to delete the quote.",
			});
		},
	});
}
