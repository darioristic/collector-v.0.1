"use client";

import type {
	InvoiceCreateInput,
	InvoiceStatus,
	InvoiceUpdateInput,
} from "@crm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { isUuid } from "@/lib/utils";
import {
	createInvoice,
	deleteInvoice,
	fetchInvoice,
	fetchInvoices,
	invoiceKeys,
	updateInvoice,
} from "@/src/queries/invoices";

type UseInvoicesOptions = {
	customerId?: string;
	orderId?: number;
	status?: InvoiceStatus;
	search?: string;
	limit?: number;
	offset?: number;
};

export function useInvoices(options: UseInvoicesOptions = {}) {
	const _unusedToast = useToast();
	return useQuery<Awaited<ReturnType<typeof fetchInvoices>>>({
		queryKey: invoiceKeys.list(options),
		queryFn: () => fetchInvoices(options),
	});
}

export function useInvoicesByCustomer(customerId: string) {
	const _unusedToast = useToast();
	return useQuery({
		queryKey: invoiceKeys.byCustomer(customerId),
		queryFn: () => fetchInvoices({ customerId }),
		enabled: Boolean(customerId),
	});
}

export function useInvoicesByOrder(orderId: number) {
	const _unusedToast = useToast();
	return useQuery({
		queryKey: invoiceKeys.byOrder(orderId),
		queryFn: () => fetchInvoices({ orderId }),
		enabled: Boolean(orderId),
	});
}

export function useInvoice(id: string, options: { enabled?: boolean } = {}) {
	const _unusedToast = useToast();
	const normalizedId = id?.trim() ?? "";
	return useQuery<Awaited<ReturnType<typeof fetchInvoice>>>({
		queryKey: invoiceKeys.detail(id),
		queryFn: () => fetchInvoice(id),
		enabled: options.enabled ?? isUuid(normalizedId),
		retry: 2,
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
		staleTime: 1000 * 30,
	});
}

export function useCreateInvoice() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (input: InvoiceCreateInput) => createInvoice(input),
		onSuccess: async (invoice) => {
			// Seed detail cache immediately for instant render on navigation
			queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
			await queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
			toast({
				title: "Invoice created",
				description: "The invoice has been created successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Creation failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to create the invoice.",
			});
		},
	});
}

export function useUpdateInvoice() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: InvoiceUpdateInput;
		}) => updateInvoice(id, input),
		onSuccess: async (invoice) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: invoiceKeys.detail(invoice.id),
				}),
			]);
			toast({
				title: "Invoice updated",
				description: "The invoice has been updated successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Update failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to update the invoice.",
			});
		},
	});
}

export function useDeleteInvoice() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (id: string) => deleteInvoice(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
			toast({
				title: "Invoice deleted",
				description: "The invoice has been removed.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Delete failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to delete the invoice.",
			});
		},
	});
}
