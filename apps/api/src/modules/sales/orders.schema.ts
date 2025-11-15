import type { FastifySchema } from "fastify";

const orderItemSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    orderId: { type: "number" },
    productId: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    quantity: { type: "number" },
    unitPrice: { type: "number" },
    total: { type: "number" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "orderId", "quantity", "unitPrice", "total", "createdAt"],
  additionalProperties: false
};

const orderSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    orderNumber: { type: "string" },
    quoteId: { type: ["number", "null"] },
    companyId: { type: ["string", "null"] },
    contactId: { type: ["string", "null"] },
    orderDate: { type: "string", format: "date" },
    expectedDelivery: { type: ["string", "null"], format: "date" },
    currency: { type: "string" },
    subtotal: { type: "number" },
    tax: { type: "number" },
    total: { type: "number" },
    status: { type: "string" },
    notes: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    items: {
      type: "array",
      items: orderItemSchema
    }
  },
  required: [
    "id",
    "orderNumber",
    "orderDate",
    "currency",
    "subtotal",
    "tax",
    "total",
    "status",
    "createdAt",
    "updatedAt"
  ],
  additionalProperties: false
};

export const listOrdersSchema: FastifySchema = {
  tags: ["sales-orders"],
  summary: "List orders",
  description: "Vraća listu porudžbina sa opcionim filtriranjem po kompaniji, kontaktu, ponudi, statusu i pretrazi. Podržava paginaciju.",
  querystring: {
    type: "object",
    properties: {
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
      quoteId: { type: "string", pattern: "^[0-9]+$" },
      status: { type: "string" },
      search: { type: "string", maxLength: 255 },
      limit: { type: "string", pattern: "^[0-9]+$" },
      offset: { type: "string", pattern: "^[0-9]+$" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            ...orderSchema,
            properties: {
              ...orderSchema.properties,
              items: { type: "array" } // Simplified for list view
            }
          }
        },
        total: { type: "number" },
        limit: { type: "number" },
        offset: { type: "number" }
      },
      required: ["data", "total", "limit", "offset"],
      additionalProperties: false
    }
  }
};

export const getOrderSchema: FastifySchema = {
  tags: ["sales-orders"],
  summary: "Get order by ID",
  description: "Vraća detaljne informacije o konkretnoj porudžbini uključujući sve stavke.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: orderSchema
      },
      required: ["data"],
      additionalProperties: false
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      required: ["error"],
      additionalProperties: false
    }
  }
};

const orderItemCreateSchema = {
  type: "object",
  properties: {
    productId: { type: "string", format: "uuid" },
    description: { type: "string" },
    quantity: { type: "number", minimum: 1 },
    unitPrice: { type: "number", minimum: 0 }
  },
  required: ["quantity", "unitPrice"],
  additionalProperties: false
};

export const createOrderSchema: FastifySchema = {
  tags: ["sales-orders"],
  summary: "Create a new order",
  description: "Kreira novu porudžbinu sa stavkama. Može biti povezana sa ponudom. Automatski se računaju subtotal, tax i total.",
  body: {
    type: "object",
    properties: {
      orderNumber: { type: "string" },
      quoteId: { type: "number" },
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
      orderDate: { type: "string", format: "date" },
      expectedDelivery: { type: "string", format: "date" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: orderItemCreateSchema,
        minItems: 1
      }
    },
    required: ["orderNumber", "items"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        data: orderSchema
      },
      required: ["data"],
      additionalProperties: false
    }
  }
};

export const updateOrderSchema: FastifySchema = {
  tags: ["sales-orders"],
  summary: "Update an order",
  description: "Ažurira postojeću porudžbinu. Mogu se ažurirati svi podaci uključujući stavke.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: {
    type: "object",
    properties: {
      quoteId: { type: "number" },
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
      orderDate: { type: "string", format: "date" },
      expectedDelivery: { type: "string", format: "date" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: orderItemCreateSchema
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: orderSchema
      },
      required: ["data"],
      additionalProperties: false
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      required: ["error"],
      additionalProperties: false
    }
  }
};

export const deleteOrderSchema: FastifySchema = {
  tags: ["sales-orders"],
  summary: "Delete an order",
  description: "Briše porudžbinu iz sistema. Operacija je trajna.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    204: {
      type: "null",
      description: "Order deleted successfully"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      required: ["error"],
      additionalProperties: false
    }
  }
};