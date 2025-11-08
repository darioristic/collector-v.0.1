import type { FastifyReply, FastifyRequest } from "fastify";

import { inventoryStore } from "./products.controller";
import type { InventoryEntry } from "./products.schema";

export const listInventory = async (_request: FastifyRequest, reply: FastifyReply) => {
  const response: InventoryEntry[] = inventoryStore.map((entry) => ({ ...entry }));
  await reply.status(200).send({ data: response });
};

