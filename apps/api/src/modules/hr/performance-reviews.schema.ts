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

const performanceReviewProperties = {
  id: { type: "string", format: "uuid" },
  employeeId: { type: "string", format: "uuid" },
  employeeName: { type: "string" },
  reviewDate: { type: "string", format: "date-time" },
  periodStart: { type: "string", format: "date-time" },
  periodEnd: { type: "string", format: "date-time" },
  reviewerId: { type: ["string", "null"], format: "uuid" },
  reviewerName: { type: ["string", "null"] },
  rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
  comments: { type: ["string", "null"] },
  goals: { type: ["string", "null"] },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" }
} as const;

const performanceReviewCreateBody = {
  type: "object",
  properties: {
    employeeId: { type: "string", format: "uuid" },
    reviewDate: { type: "string", format: "date-time" },
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    reviewerId: { type: ["string", "null"], format: "uuid" },
    rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    comments: { type: ["string", "null"] },
    goals: { type: ["string", "null"] }
  },
  required: ["employeeId", "reviewDate", "periodStart", "periodEnd"],
  additionalProperties: false
} as const;

const performanceReviewUpdateBody = {
  type: "object",
  properties: {
    reviewDate: { type: "string", format: "date-time" },
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    reviewerId: { type: ["string", "null"], format: "uuid" },
    rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    comments: { type: ["string", "null"] },
    goals: { type: ["string", "null"] }
  },
  additionalProperties: false
} as const;

export const performanceReviewListSchema: FastifySchema = {
  tags: ["hr-performance-reviews"],
  summary: "List performance reviews",
  description: "Vraća listu performance reviews sa filtriranjem i paginacijom.",
  querystring: {
    type: "object",
    properties: {
      employeeId: { type: "string", format: "uuid" },
      reviewerId: { type: "string", format: "uuid" },
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
          properties: performanceReviewProperties,
          required: [
            "id",
            "employeeId",
            "reviewDate",
            "periodStart",
            "periodEnd",
            "createdAt",
            "updatedAt"
          ],
          additionalProperties: false
        }
      }),
      description: "Lista performance reviews"
    }
  }
};

export const performanceReviewGetSchema: FastifySchema = {
  tags: ["hr-performance-reviews"],
  summary: "Get performance review by ID",
  description: "Vraća performance review po ID-u.",
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
        properties: performanceReviewProperties,
        required: [
          "id",
          "employeeId",
          "reviewDate",
          "periodStart",
          "periodEnd",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Performance review"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Performance review nije pronađen"
    }
  }
};

export const performanceReviewCreateSchema: FastifySchema = {
  tags: ["hr-performance-reviews"],
  summary: "Create a new performance review",
  description: "Kreira novi performance review.",
  body: performanceReviewCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: performanceReviewProperties,
        required: [
          "id",
          "employeeId",
          "reviewDate",
          "periodStart",
          "periodEnd",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Kreiran performance review"
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

export const performanceReviewUpdateSchema: FastifySchema = {
  tags: ["hr-performance-reviews"],
  summary: "Update performance review",
  description: "Ažurira postojeći performance review.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: performanceReviewUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: performanceReviewProperties,
        required: [
          "id",
          "employeeId",
          "reviewDate",
          "periodStart",
          "periodEnd",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Ažuriran performance review"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Performance review nije pronađen"
    }
  }
};

export const performanceReviewDeleteSchema: FastifySchema = {
  tags: ["hr-performance-reviews"],
  summary: "Delete performance review",
  description: "Briše performance review.",
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
      description: "Performance review je obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Performance review nije pronađen"
    }
  }
};

