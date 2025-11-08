import { randomUUID } from "node:crypto";

import type { RouteHandler } from "fastify";

export type Deal = {
  id: string;
  accountId: string;
  title: string;
  stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closedWon" | "closedLost";
  amount: number;
  closeDate: string;
};

const dealsStore: Deal[] = [
  {
    id: "deal_001",
    accountId: "acc_001",
    title: "Enterprise Analytics Suite",
    stage: "negotiation",
    amount: 125_000,
    closeDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  },
  {
    id: "deal_002",
    accountId: "acc_002",
    title: "Customer Success Platform",
    stage: "proposal",
    amount: 48_500,
    closeDate: new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10)
  }
];

export type ListDealsReply = { data: Deal[] };
export type CreateDealBody = Omit<Deal, "id">;
export type CreateDealReply = { data: Deal };

export const listDealsHandler: RouteHandler<{ Reply: ListDealsReply }> = async () => {
  return { data: dealsStore };
};

export const createDealHandler: RouteHandler<{
  Body: CreateDealBody;
  Reply: CreateDealReply;
}> = async (request, reply) => {
  const newDeal: Deal = {
    id: randomUUID(),
    ...request.body
  };

  dealsStore.push(newDeal);

  reply.code(201);
  return { data: newDeal };
};

export const mockDeals = dealsStore;


