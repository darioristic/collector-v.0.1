import type { FastifySchema } from "fastify";
import type {
  InventoryEntry as InventoryEntryType,
  Product,
  ProductCreateInput,
  ProductUpdateInput
} from "@crm/types";

const productProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1, maxLength: 120 },
  sku: { type: "string", minLength: 1, maxLength: 64 },
  price: { type: "number", minimum: 0 },
  currency: { type: "string", minLength: 3, maxLength: 3 },
  category: { type: "string", minLength: 1, maxLength: 80 },
  active: { type: "boolean", default: true },
  relatedSalesOrders: {
    type: "array",
    items: { type: "string", minLength: 1 },
    description: "Placeholder za vezu sa prodajnim porudžbinama",
    default: []
  }
} as const;

const inventoryProperties = {
  productId: productProperties.id,
  warehouse: { type: "string", minLength: 1, maxLength: 80 },
  quantity: { type: "integer", minimum: 0 },
  threshold: { type: "integer", minimum: 0 }
} as const;

const productEntitySchema = {
  type: "object",
  properties: productProperties,
  required: ["id", "name", "sku", "price", "currency", "category", "active"],
  additionalProperties: false
} as const;

const productCollectionSchema = {
  type: "array",
  items: productEntitySchema
} as const;

const inventoryItemSchema = {
  type: "object",
  properties: inventoryProperties,
  required: ["productId", "warehouse", "quantity", "threshold"],
  additionalProperties: false
} as const;

const inventoryCollectionSchema = {
  type: "array",
  items: inventoryItemSchema
} as const;

const productBodySchema = {
  type: "object",
  properties: {
    name: productProperties.name,
    sku: productProperties.sku,
    price: productProperties.price,
    currency: productProperties.currency,
    category: productProperties.category,
    active: productProperties.active,
    relatedSalesOrders: productProperties.relatedSalesOrders
  },
  required: ["name", "sku", "price", "currency", "category"],
  additionalProperties: false
} as const;

const productUpdateBodySchema = {
  type: "object",
  properties: productBodySchema.properties,
  additionalProperties: false,
  minProperties: 1
} as const;

const productIdParamsSchema = {
  type: "object",
  properties: {
    id: productProperties.id
  },
  required: ["id"],
  additionalProperties: false
} as const;

const dataEnvelope = (itemsSchema: object) =>
  ({
    type: "object",
    properties: {
      data: itemsSchema
    },
    required: ["data"],
    additionalProperties: false
  }) as const;

export const listProductsSchema: FastifySchema = {
  tags: ["products"],
  summary: "Lista proizvoda",
  response: {
    200: dataEnvelope(productCollectionSchema)
  }
};

export const createProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Kreiranje proizvoda",
  body: productBodySchema,
  response: {
    201: dataEnvelope(productEntitySchema)
  }
};

export const updateProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Ažuriranje proizvoda",
  params: productIdParamsSchema,
  body: productUpdateBodySchema,
  response: {
    200: dataEnvelope(productEntitySchema)
  }
};

export const deleteProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Brisanje proizvoda",
  params: productIdParamsSchema,
  response: {
    204: { type: "null" }
  }
};

export const listInventorySchema: FastifySchema = {
  tags: ["products"],
  summary: "Stanje zaliha po skladištu",
  response: {
    200: dataEnvelope(inventoryCollectionSchema)
  }
};

export type ProductEntity = Product;
export type ProductCreateBody = ProductCreateInput;
export type ProductUpdateBody = ProductUpdateInput;
export type ProductIdParams = { id: string };
export type InventoryEntry = InventoryEntryType;

