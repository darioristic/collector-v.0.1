import type { FastifySchema } from "fastify";

const dataEnvelope = (itemsSchema: object) =>
  ({
    type: "object",
    properties: {
      data: itemsSchema
    },
    required: ["data"],
    additionalProperties: false
  }) as const;

const payrollEntryProperties = {
  id: { type: "string", format: "uuid" },
  employeeId: { type: "string", format: "uuid" },
  employeeName: { type: "string" },
  periodStart: { type: "string", format: "date-time" },
  periodEnd: { type: "string", format: "date-time" },
  grossPay: { type: "integer" },
  netPay: { type: "integer" },
  createdAt: { type: "string", format: "date-time" }
} as const;

const payrollEntryCreateBody = {
  type: "object",
  properties: {
    employeeId: { type: "string", format: "uuid" },
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    grossPay: { type: "integer", minimum: 0 },
    netPay: { type: "integer", minimum: 0 }
  },
  required: ["employeeId", "periodStart", "periodEnd", "grossPay", "netPay"],
  additionalProperties: false
} as const;

const payrollEntryUpdateBody = {
  type: "object",
  properties: {
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    grossPay: { type: "integer", minimum: 0 },
    netPay: { type: "integer", minimum: 0 }
  },
  additionalProperties: false
} as const;

export const payrollEntryListSchema: FastifySchema = {
  tags: ["hr-payroll"],
  summary: "List payroll entries",
  description: "Vraća listu payroll unosa sa filtriranjem i paginacijom.",
  querystring: {
    type: "object",
    properties: {
      employeeId: { type: "string", format: "uuid" },
      search: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      offset: { type: "integer", minimum: 0, default: 0 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: payrollEntryProperties,
          required: ["id", "employeeId", "periodStart", "periodEnd", "grossPay", "netPay", "createdAt"],
          additionalProperties: false
        }
      }),
      description: "Lista payroll unosa"
    }
  }
};

export const payrollEntryGetSchema: FastifySchema = {
  tags: ["hr-payroll"],
  summary: "Get payroll entry by ID",
  description: "Vraća payroll unos po ID-u.",
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
      ...dataEnvelope({
        type: "object",
        properties: payrollEntryProperties,
        required: ["id", "employeeId", "periodStart", "periodEnd", "grossPay", "netPay", "createdAt"],
        additionalProperties: false
      }),
      description: "Payroll unos"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Payroll unos nije pronađen"
    }
  }
};

export const payrollEntryCreateSchema: FastifySchema = {
  tags: ["hr-payroll"],
  summary: "Create a new payroll entry",
  description: "Kreira novi payroll unos.",
  body: payrollEntryCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: payrollEntryProperties,
        required: ["id", "employeeId", "periodStart", "periodEnd", "grossPay", "netPay", "createdAt"],
        additionalProperties: false
      }),
      description: "Kreiran payroll unos"
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Nevalidni podaci"
    }
  }
};

export const payrollEntryUpdateSchema: FastifySchema = {
  tags: ["hr-payroll"],
  summary: "Update payroll entry",
  description: "Ažurira postojeći payroll unos.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: payrollEntryUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: payrollEntryProperties,
        required: ["id", "employeeId", "periodStart", "periodEnd", "grossPay", "netPay", "createdAt"],
        additionalProperties: false
      }),
      description: "Ažuriran payroll unos"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Payroll unos nije pronađen"
    }
  }
};

export const payrollEntryDeleteSchema: FastifySchema = {
  tags: ["hr-payroll"],
  summary: "Delete payroll entry",
  description: "Briše payroll unos.",
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
      type: "object",
      description: "Payroll unos je obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Payroll unos nije pronađen"
    }
  }
};

