"use client";

import { OrderList } from "@/components/orders/order-list";
import { useState } from "react";
import { OrderDetail } from "@/components/orders/order-detail";
import { useDeleteOrder } from "@/src/hooks/useOrders";

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const deleteOrder = useDeleteOrder();

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
  };

  const handleCreateOrder = () => {
    // TODO: Implement create order dialog
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track your orders</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrderList onOrderClick={handleOrderClick} onCreateOrder={handleCreateOrder} />

        {selectedOrderId && (
          <OrderDetail
            orderId={selectedOrderId}
            onEdit={() => {
              // TODO: Open edit dialog
            }}
            onDelete={handleDeleteOrder}
          />
        )}
      </div>
    </div>
  );
}