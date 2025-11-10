import type { FastifySchema } from "fastify";

const quoteItemSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    quoteId: { type: "number" },
    productId: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    quantity: { type: "number" },
    unitPrice: { type: "number" },
    total: { type: "number" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "quoteId", "quantity", "unitPrice", "total", "createdAt"],
  additionalProperties: false
};

const quoteSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    quoteNumber: { type: "string" },
    companyId: { type: ["string", "null"] },
    contactId: { type: ["string", "null"] },
    issueDate: { type: "string", format: "date" },
    expiryDate: { type: ["string", "null"], format: "date" },
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
      items: quoteItemSchema
    }
  },
  required: [
    "id",
    "quoteNumber",
    "issueDate",
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

export const listQuotesSchema: FastifySchema = {
  tags: ["sales", "quotes"],
  summary: "List quotes",
  querystring: {
    type: "object",
    properties: {
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
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
            ...quoteSchema,
            properties: {
              ...quoteSchema.properties,
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

export const getQuoteSchema: FastifySchema = {
  tags: ["sales", "quotes"],
  summary: "Get quote by ID",
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
        data: quoteSchema
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

const quoteItemCreateSchema = {
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

export const createQuoteSchema: FastifySchema = {
  tags: ["sales", "quotes"],
  summary: "Create a new quote",
  body: {
    type: "object",
    properties: {
      quoteNumber: { type: "string" },
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
      issueDate: { type: "string", format: "date" },
      expiryDate: { type: "string", format: "date" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: quoteItemCreateSchema,
        minItems: 1
      }
    },
    required: ["quoteNumber", "items"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        data: quoteSchema
      },
      required: ["data"],
      additionalProperties: false
    }
  }
};

export const updateQuoteSchema: FastifySchema = {
  tags: ["sales", "quotes"],
  summary: "Update a quote",
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
      companyId: { type: "string", format: "uuid" },
      contactId: { type: "string", format: "uuid" },
      issueDate: { type: "string", format: "date" },
      expiryDate: { type: "string", format: "date" },
      currency: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      items: {
        type: "array",
        items: quoteItemCreateSchema
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: quoteSchema
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

export const deleteQuoteSchema: FastifySchema = {
  tags: ["sales", "quotes"],
  summary: "Delete a quote",
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
      description: "Quote deleted successfully"
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