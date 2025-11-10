import type { FastifySchema } from "fastify";

import { ACCOUNT_TYPES } from "./accounts.types";

const accountProperties = {
  id: { type: "string" },
  name: { type: "string", minLength: 1 },
  type: { type: "string", enum: ACCOUNT_TYPES },
  email: { type: "string", format: "email" },
  phone: { type: "string", nullable: true },
  website: { type: "string", nullable: true },
  taxId: { type: "string" },
  country: { type: "string", minLength: 2, maxLength: 2 }
} as const;

const accountResponseSchema = {
  type: "object",
  properties: {
    ...accountProperties,
    phone: { ...accountProperties.phone, nullable: true },
    website: { ...accountProperties.website, nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "name", "type", "email", "taxId", "country", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const contactResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    accountName: { anyOf: [{ type: "string" }, { type: "null" }] },
    name: { type: "string" },
    firstName: { anyOf: [{ type: "string" }, { type: "null" }] },
    lastName: { anyOf: [{ type: "string" }, { type: "null" }] },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    email: { anyOf: [{ type: "string", format: "email" }, { type: "null" }] },
    phone: { anyOf: [{ type: "string" }, { type: "null" }] },
    ownerId: { anyOf: [{ type: "string" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "accountId", "name", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const accountBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    type: { type: "string", enum: ACCOUNT_TYPES },
    email: { type: "string", format: "email" },
    phone: { type: "string" },
    website: { type: "string" },
    taxId: { type: "string" },
    country: { type: "string", minLength: 2, maxLength: 2 }
  },
  required: ["name", "type", "email", "taxId", "country"],
  additionalProperties: false
} as const;

const accountParamsSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 }
  },
  required: ["id"],
  additionalProperties: false
} as const;

const errorResponseSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" }
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false
} as const;

export const listAccountsSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "List all accounts",
  response: {
    200: {
      type: "array",
      items: accountResponseSchema
    }
  }
};

export const listContactsSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "List account contacts",
  response: {
    200: {
      type: "array",
      items: contactResponseSchema
    }
  }
};

export const getAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Get account by id",
  params: accountParamsSchema,
  response: {
    200: accountResponseSchema,
    404: errorResponseSchema
  }
};

export const createAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Create new account",
  body: accountBodySchema,
  response: {
    201: accountResponseSchema,
    400: errorResponseSchema,
    409: errorResponseSchema
  }
};

export const updateAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Update account",
  params: accountParamsSchema,
  body: accountBodySchema,
  response: {
    200: accountResponseSchema,
    400: errorResponseSchema,
    404: errorResponseSchema
  }
};

export const deleteAccountSchema: FastifySchema = {
  tags: ["accounts"],
  summary: "Delete account",
  params: accountParamsSchema,
  response: {
    204: { type: "null" },
    404: errorResponseSchema
  }
};

