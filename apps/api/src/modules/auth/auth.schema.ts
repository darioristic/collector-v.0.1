import { type FastifySchema } from "fastify";

import { roleKey } from "../../db/schema/auth.schema";
import { userStatus } from "../../db/schema/settings.schema";

const ERROR_SCHEMA = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" }
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false
} as const;

const SESSION_SCHEMA = {
  type: "object",
  properties: {
    token: { type: "string" },
    expiresAt: { type: "string", format: "date-time" }
  },
  required: ["token", "expiresAt"],
  additionalProperties: false
} as const;

const COMPANY_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    domain: { anyOf: [{ type: "string" }, { type: "null" }] },
    role: { anyOf: [{ type: "string", enum: roleKey.enumValues }, { type: "null" }] }
  },
  required: ["id", "name", "slug", "domain", "role"],
  additionalProperties: false
} as const;

const USER_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string", format: "email" },
    name: { type: "string" },
    status: { type: "string", enum: userStatus.enumValues },
    defaultCompanyId: { anyOf: [{ type: "string" }, { type: "null" }] },
    company: { anyOf: [COMPANY_SCHEMA, { type: "null" }] }
  },
  required: ["id", "email", "name", "status", "defaultCompanyId", "company"],
  additionalProperties: false
} as const;

const AUTH_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    user: USER_SCHEMA,
    session: SESSION_SCHEMA
  },
  required: ["user", "session"],
  additionalProperties: false
} as const;

const DATA_ENVELOPE = (payload: object) =>
  ({
    type: "object",
    properties: {
      data: payload
    },
    required: ["data"],
    additionalProperties: false
  }) as const;

const REGISTER_BODY = {
  type: "object",
  properties: {
    companyName: { type: "string", minLength: 1 },
    companyDomain: { type: "string" },
    fullName: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 }
  },
  required: ["companyName", "fullName", "email", "password"],
  additionalProperties: false
} as const;

const LOGIN_BODY = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 }
  },
  required: ["email", "password"],
  additionalProperties: false
} as const;

const FORGOT_PASSWORD_BODY = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" }
  },
  required: ["email"],
  additionalProperties: false
} as const;

const RESET_PASSWORD_BODY = {
  type: "object",
  properties: {
    token: { type: "string", minLength: 16 },
    password: { type: "string", minLength: 8 }
  },
  required: ["token", "password"],
  additionalProperties: false
} as const;

const FORGOT_PASSWORD_RESPONSE = {
  type: "object",
  properties: {
    token: { anyOf: [{ type: "string" }, { type: "null" }] },
    expiresAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] }
  },
  required: ["token", "expiresAt"],
  additionalProperties: false
} as const;

export const registerSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Registracija nove kompanije i administratora",
  body: REGISTER_BODY,
  response: {
    201: DATA_ENVELOPE(AUTH_RESPONSE_SCHEMA),
    400: ERROR_SCHEMA,
    409: ERROR_SCHEMA
  }
};

export const loginSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Prijava korisnika",
  body: LOGIN_BODY,
  response: {
    200: DATA_ENVELOPE(AUTH_RESPONSE_SCHEMA),
    400: ERROR_SCHEMA,
    401: ERROR_SCHEMA,
    403: ERROR_SCHEMA
  }
};

export const meSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Dohvati podatke o trenutnoj sesiji",
  response: {
    200: DATA_ENVELOPE(AUTH_RESPONSE_SCHEMA),
    401: ERROR_SCHEMA
  }
};

export const logoutSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Odjava korisnika",
  response: {
    204: { type: "null" },
    400: ERROR_SCHEMA
  }
};

export const forgotPasswordSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Pokretanje resetovanja lozinke",
  body: FORGOT_PASSWORD_BODY,
  response: {
    200: DATA_ENVELOPE(FORGOT_PASSWORD_RESPONSE)
  }
};

export const resetPasswordSchema: FastifySchema = {
  tags: ["auth"],
  summary: "Reset lozinke",
  body: RESET_PASSWORD_BODY,
  response: {
    200: DATA_ENVELOPE(AUTH_RESPONSE_SCHEMA),
    400: ERROR_SCHEMA
  }
};


