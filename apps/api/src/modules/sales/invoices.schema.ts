import type { FastifySchema } from "fastify";

const invoiceItemSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    invoiceId: { type: "string", format: "uuid" },
    description: { type: ["string", "null"] },
    quantity: { type: "number" },
    unit: { type: "string" },
    unitPrice: { type: "number" },
    discountRate: { type: "number" },
    vatRate: { type: "number" },
    totalExclVat: { type: "number" },
    vatAmount: { type: "number" },
    totalInclVat: { type: "number" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: [
    "id",
    "invoiceId",
    "quantity",
    "unit",
    "unitPrice",
    "discountRate",
    "vatRate",
    "totalExclVat",
    "vatAmount",
    "totalInclVat",
    "createdAt"
  ],
  additionalProperties: false
};

const invoiceSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderId: { type: ["number", "null"] },
    invoiceNumber: { type: "string" },
    customerId: { type: "string", format: "uuid" },
    customerName: { type: "string" },
    customerEmail: { type: ["string", "null"] },
    billingAddress: { type: ["string", "null"] },
    status: { type: "string" },
    issuedAt: { type: "string", format: "date-time" },
    dueDate: { type: ["string", "null"], format: "date-time" },
    amountBeforeDiscount: { type: "number" },
    discountTotal: { type: "number" },
    subtotal: { type: "number" },
    totalVat: { type: "number" },
    total: { type: "number" },
    amountPaid: { type: "number" },
    balance: { type: "number" },
    currency: { type: "string" },
    notes: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    items: {
      type: "array",
      items: invoiceItemSchema
    }
  },
  required: [
    "id",
    "invoiceNumber",
    "customerId",
    "customerName",
    "status",
    "issuedAt",
    "amountBeforeDiscount",
    "discountTotal",
    "subtotal",
    "totalVat",
    "total",
    "amountPaid",
    "balance",
    "currency",
    "createdAt",
    "updatedAt"
  ],
  additionalProperties: false
};

export const listInvoicesSchema: FastifySchema = {
  tags: ["sales", "invoices"],
  summary: "List invoices",
  querystring: {
    type: "object",
    properties: {
      customerId: { type: "string", format: "uuid" },
      orderId: { type: "string", pattern: "^[0-9]+$" },
      status: { type: "string" },
      search: { type: "string" },
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
            ...invoiceSchema,
            properties: {
              ...invoiceSchema.properties,
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

export const getInvoiceSchema: FastifySchema = {
  tags: ["sales", "invoices"],
  summary: "Get invoice by ID",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: invoiceSchema
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

const invoiceItemCreateSchema = {
  type: "object",
  properties: {
    description: { type: "string" },
    quantity: { type: "number", minimum: 0.01 },
    unit: { type: "string" },
    unitPrice: { type: "number", minimum: 0 },
    discountRate: { type: "number", minimum: 0, maximum: 100 },
    vatRate: { type: "number", minimum: 0, maximum: 100 }
  },
  required: ["quantity", "unitPrice"],
  additionalProperties: false
};

export const createInvoiceSchema: FastifySchema = {
  tags: ["sales", "invoices"],
  summary: "Create a new invoice",
  body: {
    type: "object",
    properties: {
      invoiceNumber: { type: "string" },
      orderId: { type: "number" },
      customerId: { type: "string", format: "uuid" },
      customerName: { type: "string" },
      customerEmail: { type: "string", format: "email" },
      billingAddress: { type: "string" },
      issuedAt: { type: "string", format: "date-time" },
      dueDate: { type: "string", format: "date-time" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: invoiceItemCreateSchema,
        minItems: 1
      }
    },
    required: ["invoiceNumber", "customerId", "customerName", "items"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        data: invoiceSchema
      },
      required: ["data"],
      additionalProperties: false
    }
  }
};

export const updateInvoiceSchema: FastifySchema = {
  tags: ["sales", "invoices"],
  summary: "Update an invoice",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: {
    type: "object",
    properties: {
      orderId: { type: "number" },
      customerName: { type: "string" },
      customerEmail: { type: "string", format: "email" },
      billingAddress: { type: "string" },
      issuedAt: { type: "string", format: "date-time" },
      dueDate: { type: "string", format: "date-time" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: invoiceItemCreateSchema
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: invoiceSchema
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

export const deleteInvoiceSchema: FastifySchema = {
  tags: ["sales", "invoices"],
  summary: "Delete an invoice",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    204: {
      type: "null",
      description: "Invoice deleted successfully"
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