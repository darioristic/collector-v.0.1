import type { FastifySchema } from "fastify";

import { productStatus } from "../../db/schema/products.schema.js";

const productStatusEnum = productStatus.enumValues;

const productIdSchema = {
  type: "string",
  format: "uuid",
  minLength: 1
} as const;

const productEntitySchema = {
  type: "object",
  properties: {
    id: productIdSchema,
    name: { type: "string", minLength: 1, maxLength: 255 },
    sku: { type: "string", minLength: 1, maxLength: 64 },
    price: { type: "number", minimum: 0 },
    currency: { type: "string", minLength: 3, maxLength: 3, pattern: "^[A-Z]{3}$" },
    description: { type: ["string", "null"] },
    specifications: { type: ["object", "null"], additionalProperties: true },
    category: { type: ["string", "null"], maxLength: 255 },
    active: { type: "boolean" },
    relatedSalesOrders: {
      type: "array",
      items: { type: "string" },
      default: []
    }
  },
  required: ["id", "name", "sku", "price", "currency", "active", "relatedSalesOrders"],
  additionalProperties: false
} as const;

const productCreateBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    sku: { type: "string", minLength: 1, maxLength: 64 },
    price: { type: "number", minimum: 0 },
    currency: { type: "string", minLength: 3, maxLength: 3, pattern: "^[A-Z]{3}$" },
    description: { type: ["string", "null"] },
    specifications: { type: ["object", "null"], additionalProperties: true },
    category: { type: ["string", "null"], maxLength: 255 },
    active: { type: "boolean", default: true }
  },
  required: ["name", "sku", "price", "currency"],
  additionalProperties: false
} as const;

const productUpdateBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    sku: { type: "string", minLength: 1, maxLength: 64 },
    price: { type: "number", minimum: 0 },
    currency: { type: "string", minLength: 3, maxLength: 3, pattern: "^[A-Z]{3}$" },
    description: { type: ["string", "null"] },
    specifications: { type: ["object", "null"], additionalProperties: true },
    category: { type: ["string", "null"], maxLength: 255 },
    active: { type: "boolean" }
  },
  additionalProperties: false,
  minProperties: 1
} as const;

const productIdParamsSchema = {
  type: "object",
  properties: {
    id: productIdSchema
  },
  required: ["id"],
  additionalProperties: false
} as const;

const listProductsQuerySchema = {
  type: "object",
  properties: {
    search: { type: "string", maxLength: 255 },
    status: {
      oneOf: [
        { type: "string", enum: productStatusEnum },
        {
          type: "array",
          items: { type: "string", enum: productStatusEnum }
        }
      ]
    },
    categoryId: {
      oneOf: [
        { type: "string", format: "uuid" },
        {
          type: "array",
          items: { type: "string", format: "uuid" }
        }
      ]
    },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    offset: { type: "integer", minimum: 0, default: 0 }
  },
  additionalProperties: false
} as const;

const inventoryLocationSchema = {
  type: "object",
  properties: {
    locationId: { type: "string", format: "uuid" },
    name: { type: "string" },
    address: { type: ["string", "null"] },
    quantity: { type: "integer", minimum: 0 },
    reserved: { type: "integer", minimum: 0 },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["locationId", "name", "quantity", "reserved", "updatedAt"],
  additionalProperties: false
} as const;

const inventorySummarySchema = {
  type: "object",
  properties: {
    productId: { type: "string", format: "uuid" },
    onHand: { type: "integer", minimum: 0 },
    reserved: { type: "integer", minimum: 0 },
    available: { type: "integer" },
    locations: {
      type: "array",
      items: inventoryLocationSchema
    }
  },
  required: ["productId", "onHand", "reserved", "available", "locations"],
  additionalProperties: false
} as const;

const inventoryAdjustmentItemSchema = {
  type: "object",
  properties: {
    locationId: { type: "string", format: "uuid" },
    quantityDelta: { type: "integer" },
    reservedDelta: { type: "integer" }
  },
  required: ["locationId"],
  additionalProperties: false
} as const;

const adjustInventoryBodySchema = {
  type: "object",
  properties: {
    adjustments: {
      type: "array",
      items: inventoryAdjustmentItemSchema,
      minItems: 1
    }
  },
  required: ["adjustments"],
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

const listEnvelope = (itemsSchema: object) =>
  ({
    type: "object",
    properties: {
      data: {
        type: "array",
        items: itemsSchema
      },
      meta: {
        type: "object",
        properties: {
          total: { type: "integer", minimum: 0 },
          limit: { type: ["integer", "null"] },
          offset: { type: ["integer", "null"] }
        },
        required: ["total"],
        additionalProperties: false
      }
    },
    required: ["data", "meta"],
    additionalProperties: false
  }) as const;

export const listProductsSchema: FastifySchema = {
  tags: ["products"],
  summary: "Lista proizvoda",
  querystring: listProductsQuerySchema,
  response: {
    200: listEnvelope(productEntitySchema)
  }
};

export const getProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Detalji proizvoda",
  params: productIdParamsSchema,
  response: {
    200: dataEnvelope(productEntitySchema),
    404: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export const createProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Kreiranje proizvoda",
  body: productCreateBodySchema,
  response: {
    201: dataEnvelope(productEntitySchema),
    409: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export const updateProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Ažuriranje proizvoda",
  params: productIdParamsSchema,
  body: productUpdateBodySchema,
  response: {
    200: dataEnvelope(productEntitySchema),
    404: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    },
    409: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export const deleteProductSchema: FastifySchema = {
  tags: ["products"],
  summary: "Brisanje proizvoda",
  params: productIdParamsSchema,
  response: {
    204: { type: "null" },
    404: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export const listInventorySchema: FastifySchema = {
  tags: ["products"],
  summary: "Stanje zaliha po skladištu",
  response: {
    200: dataEnvelope({
      type: "array",
      items: inventorySummarySchema
    })
  }
};

export const getProductInventorySchema: FastifySchema = {
  tags: ["products"],
  summary: "Detalji lagera za proizvod",
  params: productIdParamsSchema,
  response: {
    200: dataEnvelope(inventorySummarySchema),
    404: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export const adjustInventorySchema: FastifySchema = {
  tags: ["products"],
  summary: "Prilagođavanje lagera proizvoda",
  params: productIdParamsSchema,
  body: adjustInventoryBodySchema,
  response: {
    200: dataEnvelope(inventorySummarySchema),
    404: {
      type: "object",
      properties: {
        statusCode: { type: "number" },
        error: { type: "string" },
        message: { type: "string" }
      },
      required: ["statusCode", "error", "message"],
      additionalProperties: false
    }
  }
};

export type ProductIdParams = { id: string };
export type ProductCreateBody = {
  name: string;
  sku: string;
  price: number;
  currency: string;
  description?: string | null;
  specifications?: Record<string, unknown> | null;
  category?: string | null;
  active?: boolean;
};
export type ProductUpdateBody = {
  name?: string;
  sku?: string;
  price?: number;
  currency?: string;
  description?: string | null;
  specifications?: Record<string, unknown> | null;
  category?: string | null;
  active?: boolean;
};

