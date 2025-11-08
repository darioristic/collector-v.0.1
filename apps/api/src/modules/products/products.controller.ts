import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import {
  type ProductCreateBody,
  type ProductEntity,
  type ProductIdParams,
  type ProductUpdateBody,
  type InventoryEntry
} from "./products.schema";

const products: ProductEntity[] = [
  {
    id: randomUUID(),
    name: "Premium Membership",
    sku: "MEM-PREMIUM-001",
    price: 199.99,
    currency: "EUR",
    category: "Memberships",
    active: true,
    relatedSalesOrders: []
  },
  {
    id: randomUUID(),
    name: "Collector Box Starter Kit",
    sku: "KIT-START-101",
    price: 89.5,
    currency: "EUR",
    category: "Starter Kits",
    active: true,
    relatedSalesOrders: []
  }
];

const inventory: InventoryEntry[] = [
  {
    productId: products[0].id,
    warehouse: "Central Warehouse",
    quantity: 120,
    threshold: 20
  },
  {
    productId: products[1].id,
    warehouse: "Central Warehouse",
    quantity: 45,
    threshold: 10
  }
];

export const inventoryStore = inventory;

type CreateRequest = FastifyRequest<{ Body: ProductCreateBody }>;
type UpdateRequest = FastifyRequest<{ Params: ProductIdParams; Body: ProductUpdateBody }>;
type DeleteRequest = FastifyRequest<{ Params: ProductIdParams }>;

export const listProducts = async (_request: FastifyRequest, reply: FastifyReply) => {
  await reply.status(200).send({ data: products });
};

export const createProduct = async (request: CreateRequest, reply: FastifyReply) => {
  const payload = request.body;
  const exists = products.some(
    (product) => product.sku.toLowerCase() === payload.sku.toLowerCase()
  );

  if (exists) {
    await reply.status(409).send({
      error: "Conflict",
      message: "SKU mora biti jedinstven",
      statusCode: 409
    });
    return;
  }

  const product: ProductEntity = {
    id: randomUUID(),
    name: payload.name,
    sku: payload.sku,
    price: payload.price,
    currency: payload.currency,
    category: payload.category,
    active: payload.active ?? true,
    relatedSalesOrders: payload.relatedSalesOrders ?? []
  };

  products.push(product);
  inventory.push({
    productId: product.id,
    warehouse: "Central Warehouse",
    quantity: 0,
    threshold: 0
  });

  await reply.status(201).send({ data: product });
};

export const updateProduct = async (request: UpdateRequest, reply: FastifyReply) => {
  const { id } = request.params;
  const payload = request.body;
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    await reply.status(404).send({
      error: "Not Found",
      message: "Proizvod ne postoji",
      statusCode: 404
    });
    return;
  }

  const current = products[index];
  const updated: ProductEntity = {
    ...current,
    ...payload,
    relatedSalesOrders: payload.relatedSalesOrders ?? current.relatedSalesOrders,
    active: payload.active ?? current.active
  };

  const duplicateSku =
    payload.sku &&
    products.some(
      (product, productIndex) =>
        productIndex !== index && product.sku.toLowerCase() === payload.sku?.toLowerCase()
    );

  if (duplicateSku) {
    await reply.status(409).send({
      error: "Conflict",
      message: "SKU mora biti jedinstven",
      statusCode: 409
    });
    return;
  }

  products[index] = updated;

  await reply.status(200).send({ data: updated });
};

export const deleteProduct = async (request: DeleteRequest, reply: FastifyReply) => {
  const { id } = request.params;
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    await reply.status(404).send({
      error: "Not Found",
      message: "Proizvod ne postoji",
      statusCode: 404
    });
    return;
  }

  products.splice(index, 1);

  for (let i = inventory.length - 1; i >= 0; i -= 1) {
    if (inventory[i]?.productId === id) {
      inventory.splice(i, 1);
    }
  }

  await reply.status(204).send();
};


