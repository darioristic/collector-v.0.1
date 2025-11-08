import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  dealId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
};

const ordersStore: Order[] = [
  {
    id: "order_001",
    dealId: "deal_001",
    items: [
      { id: "item_001", name: "Analytics Suite License", quantity: 50, unitPrice: 1_950 },
      { id: "item_002", name: "Implementation Services", quantity: 1, unitPrice: 28_500 }
    ],
    totalAmount: 50 * 1_950 + 28_500,
    status: "processing"
  },
  {
    id: "order_002",
    dealId: "deal_002",
    items: [
      { id: "item_003", name: "Customer Success Platform License", quantity: 20, unitPrice: 1_850 }
    ],
    totalAmount: 20 * 1_850,
    status: "pending"
  }
];

export type ListOrdersReply = { data: Order[] };
export type CreateOrderItemBody = Omit<OrderItem, "id"> & { id?: string };
export type CreateOrderBody = {
  dealId: string;
  items: CreateOrderItemBody[];
  status: Order["status"];
};
export type CreateOrderReply = { data: Order };

const calculateTotalAmount = (items: OrderItem[]) =>
  items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

export const listOrdersHandler: RouteHandler<{ Reply: ListOrdersReply }> = async () => {
  return { data: ordersStore };
};

export const createOrderHandler: RouteHandler<{
  Body: CreateOrderBody;
  Reply: CreateOrderReply;
}> = async (request, reply) => {
  const itemsWithIds: OrderItem[] = request.body.items.map((item) => ({
    id: item.id ?? randomUUID(),
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice
  }));

  const newOrder: Order = {
    id: randomUUID(),
    dealId: request.body.dealId,
    items: itemsWithIds,
    totalAmount: calculateTotalAmount(itemsWithIds),
    status: request.body.status
  };

  ordersStore.push(newOrder);

  reply.code(201);
  return { data: newOrder };
};

export const mockOrders = ordersStore;


