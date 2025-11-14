"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { OrderDetail } from "@/components/orders/order-detail";
import { OrderList } from "@/components/orders/order-list";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";
import { useDeleteOrder } from "@/src/hooks/useOrders";

export default function OrdersPage() {
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const deleteOrder = useDeleteOrder();

	const handleOrderClick = (orderId: number) => {
		setSelectedOrderId(orderId);
	};

	const handleCreateOrder = () => {
		alert("Create order dialog - Coming soon!");
	};

	const handleDeleteOrder = async (orderId: number) => {
		if (confirm("Are you sure you want to delete this order?")) {
			await deleteOrder.mutateAsync(orderId);
			if (selectedOrderId === orderId) {
				setSelectedOrderId(null);
			}
		}
	};

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Orders"
				description="Manage and track your orders."
				actions={
					<Button type="button" onClick={handleCreateOrder} className="gap-2">
						<Plus className="h-4 w-4" aria-hidden="true" />
						New Order
					</Button>
				}
			/>

			<div
				className={`grid gap-6 ${selectedOrderId ? "lg:grid-cols-2" : "grid-cols-1"}`}
			>
				<OrderList
					onOrderClick={handleOrderClick}
					onCreateOrder={handleCreateOrder}
					showCreateAction={false}
				/>

				{selectedOrderId && (
					<OrderDetail
						orderId={selectedOrderId}
						onEdit={() => {
							alert("Edit order dialog - Coming soon!");
						}}
						onDelete={handleDeleteOrder}
					/>
				)}
			</div>
		</div>
	);
}
