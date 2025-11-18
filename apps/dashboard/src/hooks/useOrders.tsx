"use client";

import type {
	OrderCreateInput,
	OrderStatus,
	OrderUpdateInput,
} from "@crm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import {
	createOrder,
	deleteOrder,
	fetchOrder,
	fetchOrders,
	orderKeys,
	updateOrder,
} from "@/src/queries/orders";

type UseOrdersOptions = {
	companyId?: string;
	contactId?: string;
	quoteId?: number;
	status?: OrderStatus;
	search?: string;
	limit?: number;
	offset?: number;
};

export function useOrders(options: UseOrdersOptions = {}) {
	return useQuery({
		queryKey: orderKeys.list(options),
		queryFn: () => fetchOrders(options),
	});
}

export function useOrdersByCompany(companyId: string) {
	return useQuery({
		queryKey: orderKeys.byCompany(companyId),
		queryFn: () => fetchOrders({ companyId }),
		enabled: Boolean(companyId),
	});
}

export function useOrdersByContact(contactId: string) {
	return useQuery({
		queryKey: orderKeys.byContact(contactId),
		queryFn: () => fetchOrders({ contactId }),
		enabled: Boolean(contactId),
	});
}

export function useOrdersByQuote(quoteId: number) {
	return useQuery({
		queryKey: orderKeys.byQuote(quoteId),
		queryFn: () => fetchOrders({ quoteId }),
		enabled: Boolean(quoteId),
	});
}

export function useOrder(id: number, options: { enabled?: boolean } = {}) {
	return useQuery({
		queryKey: orderKeys.detail(id),
		queryFn: () => fetchOrder(id),
		enabled: options.enabled ?? Boolean(id),
	});
}

export function useCreateOrder() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (input: OrderCreateInput) => createOrder(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
			toast({
				title: "Order created",
				description: "The order has been created successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Creation failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to create the order.",
			});
		},
	});
}

export function useUpdateOrder() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: number;
			input: OrderUpdateInput;
		}) => updateOrder(id, input),
		onSuccess: async (order) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) }),
			]);
			toast({
				title: "Order updated",
				description: "The order has been updated successfully.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Update failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to update the order.",
			});
		},
	});
}

export function useDeleteOrder() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (id: number) => deleteOrder(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
			toast({
				title: "Order deleted",
				description: "The order has been removed.",
			});
		},
		onError: (error) => {
			toast({
				variant: "destructive",
				title: "Delete failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to delete the order.",
			});
		},
	});
}
