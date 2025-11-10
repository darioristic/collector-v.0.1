import type { FastifySchema } from "fastify";

const paymentProperties = {
  id: { type: "string", minLength: 1 },
  invoiceId: { type: "string", minLength: 1 },
  companyId: { type: ["string", "null"] },
  contactId: { type: ["string", "null"] },
  status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
  amount: { type: "number", minimum: 0 },
  currency: { type: "string" },
  method: { type: "string", enum: ["bank_transfer", "cash", "card", "crypto"] },
  reference: { type: ["string", "null"] },
  notes: { type: ["string", "null"] },
  paymentDate: { type: "string", format: "date" },
  createdAt: { type: "string", format: "date-time" }
} as const;

export const listPaymentsSchema: FastifySchema = {
  tags: ["finance", "payments"],
  summary: "List payments",
  querystring: {
    type: "object",
    properties: {
      invoiceId: { type: "string" },
      status: { type: "string" },
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
            type: "object",
            properties: paymentProperties,
            required: [
              "id",
              "invoiceId",
              "status",
              "amount",
              "currency",
              "method",
              "paymentDate",
              "createdAt"
            ],
            additionalProperties: false
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
} satisfies FastifySchema;

export const getPaymentSchema: FastifySchema = {
  tags: ["finance", "payments"],
  summary: "Get payment details",
  params: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: paymentProperties,
          required: [
            "id",
            "invoiceId",
            "status",
            "amount",
            "currency",
            "method",
            "paymentDate",
            "createdAt"
          ],
          additionalProperties: false
        }
      },
      required: ["data"],
      additionalProperties: false
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    }
  }
} satisfies FastifySchema;

export const createPaymentSchema: FastifySchema = {
  tags: ["finance", "payments"],
  summary: "Create a new payment",
  body: {
    type: "object",
    properties: {
      invoiceId: { type: "string", minLength: 1 },
      amount: { type: "number", minimum: 0.01 },
      currency: { type: "string" },
      method: { type: "string", enum: ["bank_transfer", "cash", "card", "crypto"] },
      reference: { type: "string" },
      notes: { type: "string" },
      paymentDate: { type: "string", format: "date" },
      status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] }
    },
    required: ["invoiceId", "amount", "method"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: paymentProperties,
          required: [
            "id",
            "invoiceId",
            "status",
            "amount",
            "currency",
            "method",
            "paymentDate",
            "createdAt"
          ],
          additionalProperties: false
        }
      },
      required: ["data"],
      additionalProperties: false
    },
    400: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    }
  }
} satisfies FastifySchema;

export const deletePaymentSchema: FastifySchema = {
  tags: ["finance", "payments"],
  summary: "Delete a payment",
  params: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 }
    },
    required: ["id"],
    additionalProperties: false
  },
  response: {
    204: {
      type: "null",
      description: "Payment deleted successfully"
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    }
  }
} satisfies FastifySchema;

export type PaymentIdParams = { id: string };
export type PaymentCreateBody = {
  invoiceId: string;
  amount: number;
  currency?: string;
  method: "bank_transfer" | "cash" | "card" | "crypto";
  reference?: string;
  notes?: string;
  paymentDate?: string;
  status?: "pending" | "completed" | "failed" | "refunded";
};