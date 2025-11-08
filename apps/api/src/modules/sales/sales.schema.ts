import type { FastifySchema } from "fastify";

const dataEnvelope = (schema: object) =>
  ({
    type: "object",
    properties: {
      data: schema
    },
    required: ["data"],
    additionalProperties: false
  }) as const;

const dealProperties = {
  id: { type: "string" },
  accountId: { type: "string" },
  title: { type: "string", minLength: 1 },
  stage: {
    type: "string",
    enum: ["prospecting", "qualification", "proposal", "negotiation", "closedWon", "closedLost"]
  },
  amount: { type: "number", minimum: 0 },
  closeDate: { type: "string", format: "date" }
} as const;

const orderItemProperties = {
  id: { type: "string" },
  name: { type: "string", minLength: 1 },
  quantity: { type: "number", minimum: 1 },
  unitPrice: { type: "number", minimum: 0 }
} as const;

const orderProperties = {
  id: { type: "string" },
  dealId: { type: "string" },
  items: {
    type: "array",
    items: {
      type: "object",
      properties: orderItemProperties,
      required: ["id", "name", "quantity", "unitPrice"],
      additionalProperties: false
    },
    minItems: 1
  },
  totalAmount: { type: "number", minimum: 0 },
  status: {
    type: "string",
    enum: ["pending", "processing", "completed", "cancelled"]
  }
} as const;

const invoiceProperties = {
  id: { type: "string" },
  orderId: { type: "string" },
  issueDate: { type: "string", format: "date" },
  dueDate: { type: "string", format: "date" },
  amount: { type: "number", minimum: 0 },
  status: { type: "string", enum: ["draft", "sent", "paid", "overdue"] }
} as const;

export const listDealsSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: dealProperties,
        required: Object.keys(dealProperties),
        additionalProperties: false
      }
    })
  }
};

export const createDealSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      accountId: dealProperties.accountId,
      title: dealProperties.title,
      stage: dealProperties.stage,
      amount: dealProperties.amount,
      closeDate: dealProperties.closeDate
    },
    required: ["accountId", "title", "stage", "amount", "closeDate"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: dealProperties,
      required: Object.keys(dealProperties),
      additionalProperties: false
    })
  }
};

export const listOrdersSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: orderProperties,
        required: Object.keys(orderProperties),
        additionalProperties: false
      }
    })
  }
};

export const createOrderSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      dealId: orderProperties.dealId,
      status: orderProperties.status,
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ...orderItemProperties,
            id: {
              ...orderItemProperties.id,
              nullable: true
            }
          },
          required: ["name", "quantity", "unitPrice"],
          additionalProperties: false
        },
        minItems: 1
      }
    },
    required: ["dealId", "status", "items"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: orderProperties,
      required: Object.keys(orderProperties),
      additionalProperties: false
    })
  }
};

export const listInvoicesSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: invoiceProperties,
        required: Object.keys(invoiceProperties),
        additionalProperties: false
      }
    })
  }
};

export const createInvoiceSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      orderId: invoiceProperties.orderId,
      issueDate: invoiceProperties.issueDate,
      dueDate: invoiceProperties.dueDate,
      amount: invoiceProperties.amount,
      status: invoiceProperties.status
    },
    required: ["orderId", "issueDate", "dueDate", "amount", "status"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: invoiceProperties,
      required: Object.keys(invoiceProperties),
      additionalProperties: false
    })
  }
};


