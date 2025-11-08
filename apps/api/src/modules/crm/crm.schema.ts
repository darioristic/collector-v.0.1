import type { FastifySchema } from "fastify";

import { ACTIVITY_TYPES, LEAD_STATUSES, OPPORTUNITY_STAGES } from "@crm/types";

const nullableDateTime = {
  anyOf: [
    { type: "string", format: "date-time" },
    { type: "null" }
  ]
} as const;

const leadProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  email: { type: "string", format: "email" },
  status: {
    type: "string",
    enum: LEAD_STATUSES
  },
  source: { type: "string", minLength: 1 },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: nullableDateTime
} as const;

const opportunityProperties = {
  id: { type: "string", minLength: 1 },
  accountId: { type: "string", minLength: 1 },
  title: { type: "string", minLength: 1 },
  stage: {
    type: "string",
    enum: OPPORTUNITY_STAGES
  },
  value: { type: "number", minimum: 0 },
  probability: { type: "number", minimum: 0, maximum: 100 },
  closeDate: { type: "string", format: "date" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: nullableDateTime
} as const;

const activityProperties = {
  id: { type: "string", minLength: 1 },
  type: {
    type: "string",
    enum: ACTIVITY_TYPES
  },
  subject: { type: "string", minLength: 1 },
  date: { type: "string", format: "date-time" },
  relatedTo: { type: "string", minLength: 1 },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: nullableDateTime
} as const;

const dataEnvelope = (itemsSchema: object) => ({
  type: "object",
  properties: {
    data: itemsSchema
  },
  required: ["data"],
  additionalProperties: false
}) as const;

const idParams = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 }
  },
  required: ["id"],
  additionalProperties: false
} as const;

const paginationProperties = {
  limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
  offset: { type: "integer", minimum: 0, default: 0 }
} as const;

const leadListQuery = {
  type: "object",
  properties: {
    status: { type: "string", enum: LEAD_STATUSES },
    source: { type: "string", minLength: 1 },
    q: { type: "string", minLength: 1 },
    ...paginationProperties
  },
  additionalProperties: false
} as const;

const opportunityListQuery = {
  type: "object",
  properties: {
    stage: { type: "string", enum: OPPORTUNITY_STAGES },
    accountId: { type: "string", minLength: 1 },
    minProbability: { type: "number", minimum: 0, maximum: 100 },
    ...paginationProperties
  },
  additionalProperties: false
} as const;

const activityListQuery = {
  type: "object",
  properties: {
    type: { type: "string", enum: ACTIVITY_TYPES },
    relatedTo: { type: "string", minLength: 1 },
    ...paginationProperties
  },
  additionalProperties: false
} as const;

const leadCreateBody = {
  type: "object",
  properties: {
    name: leadProperties.name,
    email: leadProperties.email,
    status: leadProperties.status,
    source: leadProperties.source,
    createdAt: leadProperties.createdAt,
    updatedAt: leadProperties.updatedAt
  },
  required: ["name", "email", "status", "source"],
  additionalProperties: false
} as const;

const leadUpdateBody = {
  type: "object",
  properties: {
    name: leadProperties.name,
    email: leadProperties.email,
    status: leadProperties.status,
    source: leadProperties.source,
    updatedAt: leadProperties.updatedAt
  },
  additionalProperties: false,
  minProperties: 1
} as const;

const opportunityCreateBody = {
  type: "object",
  properties: {
    accountId: opportunityProperties.accountId,
    title: opportunityProperties.title,
    stage: opportunityProperties.stage,
    value: opportunityProperties.value,
    probability: opportunityProperties.probability,
    closeDate: opportunityProperties.closeDate,
    createdAt: opportunityProperties.createdAt,
    updatedAt: opportunityProperties.updatedAt
  },
  required: ["accountId", "title", "stage", "value", "probability", "closeDate"],
  additionalProperties: false
} as const;

const opportunityUpdateBody = {
  type: "object",
  properties: {
    accountId: opportunityProperties.accountId,
    title: opportunityProperties.title,
    stage: opportunityProperties.stage,
    value: opportunityProperties.value,
    probability: opportunityProperties.probability,
    closeDate: opportunityProperties.closeDate,
    updatedAt: opportunityProperties.updatedAt
  },
  additionalProperties: false,
  minProperties: 1
} as const;

const activityCreateBody = {
  type: "object",
  properties: {
    type: activityProperties.type,
    subject: activityProperties.subject,
    date: activityProperties.date,
    relatedTo: activityProperties.relatedTo
  },
  required: ["type", "subject", "relatedTo"],
  additionalProperties: false
} as const;

const activityUpdateBody = {
  type: "object",
  properties: {
    type: activityProperties.type,
    subject: activityProperties.subject,
    date: activityProperties.date,
    relatedTo: activityProperties.relatedTo,
    updatedAt: activityProperties.updatedAt
  },
  additionalProperties: false,
  minProperties: 1
} as const;

export const leadListSchema: FastifySchema = {
  querystring: leadListQuery,
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: leadProperties,
        required: ["id", "name", "email", "status", "source", "createdAt"],
        additionalProperties: false
      }
    })
  }
};

export const leadDetailSchema: FastifySchema = {
  params: idParams,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: leadProperties,
      required: ["id", "name", "email", "status", "source", "createdAt"],
      additionalProperties: false
    })
  }
};

export const leadCreateSchema: FastifySchema = {
  body: leadCreateBody,
  response: {
    201: dataEnvelope({
      type: "object",
      properties: leadProperties,
      required: ["id", "name", "email", "status", "source", "createdAt"],
      additionalProperties: false
    })
  }
};

export const leadUpdateSchema: FastifySchema = {
  params: idParams,
  body: leadUpdateBody,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: leadProperties,
      required: ["id", "name", "email", "status", "source", "createdAt"],
      additionalProperties: false
    })
  }
};

export const leadDeleteSchema: FastifySchema = {
  params: idParams,
  response: {
    204: { type: "null" }
  }
};

export const opportunityListSchema: FastifySchema = {
  querystring: opportunityListQuery,
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: opportunityProperties,
        required: [
          "id",
          "accountId",
          "title",
          "stage",
          "value",
          "probability",
          "closeDate",
          "createdAt"
        ],
        additionalProperties: false
      }
    })
  }
};

export const opportunityDetailSchema: FastifySchema = {
  params: idParams,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: opportunityProperties,
      required: [
        "id",
        "accountId",
        "title",
        "stage",
        "value",
        "probability",
        "closeDate",
        "createdAt"
      ],
      additionalProperties: false
    })
  }
};

export const opportunityCreateSchema: FastifySchema = {
  body: opportunityCreateBody,
  response: {
    201: dataEnvelope({
      type: "object",
      properties: opportunityProperties,
      required: [
        "id",
        "accountId",
        "title",
        "stage",
        "value",
        "probability",
        "closeDate",
        "createdAt"
      ],
      additionalProperties: false
    })
  }
};

export const opportunityUpdateSchema: FastifySchema = {
  params: idParams,
  body: opportunityUpdateBody,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: opportunityProperties,
      required: [
        "id",
        "accountId",
        "title",
        "stage",
        "value",
        "probability",
        "closeDate",
        "createdAt"
      ],
      additionalProperties: false
    })
  }
};

export const opportunityDeleteSchema: FastifySchema = {
  params: idParams,
  response: {
    204: { type: "null" }
  }
};

export const activityListSchema: FastifySchema = {
  querystring: activityListQuery,
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: activityProperties,
        required: ["id", "type", "subject", "date", "relatedTo", "createdAt"],
        additionalProperties: false
      }
    })
  }
};

export const activityDetailSchema: FastifySchema = {
  params: idParams,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: activityProperties,
      required: ["id", "type", "subject", "date", "relatedTo", "createdAt"],
      additionalProperties: false
    })
  }
};

export const activityCreateSchema: FastifySchema = {
  body: activityCreateBody,
  response: {
    201: dataEnvelope({
      type: "object",
      properties: activityProperties,
      required: ["id", "type", "subject", "date", "relatedTo", "createdAt"],
      additionalProperties: false
    })
  }
};

export const activityUpdateSchema: FastifySchema = {
  params: idParams,
  body: activityUpdateBody,
  response: {
    200: dataEnvelope({
      type: "object",
      properties: activityProperties,
      required: ["id", "type", "subject", "date", "relatedTo", "createdAt"],
      additionalProperties: false
    })
  }
};

export const activityDeleteSchema: FastifySchema = {
  params: idParams,
  response: {
    204: { type: "null" }
  }
};


