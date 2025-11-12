"use client";

import type { Payment, PaymentCreateInput } from "@crm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import { invoiceKeys } from "@/src/queries/invoices";
import {
	createPayment,
	deletePayment,
	fetchPayment,
	fetchPayments,
	paymentKeys,
} from "@/src/queries/payments";

type UsePaymentsOptions = {
	invoiceId?: string;
	status?: string;
	limit?: number;
	offset?: number;
};

export function usePayments(options: UsePaymentsOptions = {}) {
	return useQuery({
		queryKey: paymentKeys.list(options),
		queryFn: () => fetchPayments(options),
	});
}

export function usePaymentsByInvoice(invoiceId: string) {
	return useQuery({
		queryKey: paymentKeys.byInvoice(invoiceId),
		queryFn: () => fetchPayments({ invoiceId }),
		enabled: Boolean(invoiceId),
	});
}

export function usePayment(id: string, options: { enabled?: boolean } = {}) {
	return useQuery({
		queryKey: paymentKeys.detail(id),
		queryFn: () => fetchPayment(id),
		enabled: options.enabled ?? Boolean(id),
	});
}

export function useCreatePayment() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (input: PaymentCreateInput) => createPayment(input),
		onSuccess: async (payment) => {
			// Invalidate payments list and invoice detail
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: paymentKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: invoiceKeys.detail(payment.invoiceId),
				}),
				queryClient.invalidateQueries({ queryKey: invoiceKeys.list() }),
			]);
			toast({
				title: "Payment recorded",
				description: "The payment has been saved successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Save failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to save the payment.",
			});
		},
	});
}

export function useDeletePayment() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (id: string) => deletePayment(id),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: paymentKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: invoiceKeys.list() }),
			]);
			toast({
				title: "Payment deleted",
				description: "The payment has been removed.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Delete failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to delete the payment.",
			});
		},
	});
}
