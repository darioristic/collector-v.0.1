"use client";

import { useState } from "react";

import { OrderList } from "@/components/orders/order-list";
import { OrderDetail } from "@/components/orders/order-detail";
import { useDeleteOrder } from "@/src/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">Manage and track your orders.</p>
        </div>
        <Button type="button" onClick={handleCreateOrder} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Order
        </Button>
      </div>

      <div className={`grid gap-6 ${selectedOrderId ? "lg:grid-cols-2" : "grid-cols-1"}`}>
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
