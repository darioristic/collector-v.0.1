import type { FastifySchema } from "fastify";

import { ACTIVITY_PRIORITIES, ACTIVITY_STATUSES, ACTIVITY_TYPES, LEAD_STATUSES, OPPORTUNITY_STAGES } from "@crm/types";

const nullableDateTime = {
  anyOf: [
    { type: "string", format: "date-time" },
    { type: "null" }
  ]
} as const;

const nullableString = {
  anyOf: [
    { type: "string", minLength: 1 },
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
  title: { type: "string", minLength: 1 },
  clientId: { type: "string", minLength: 1 },
  clientName: { type: "string", minLength: 1 },
  assignedTo: {
    anyOf: [
      { type: "string", minLength: 1 },
      { type: "null" }
    ]
  },
  assignedToName: {
    anyOf: [
      { type: "string", minLength: 1 },
      { type: "null" }
    ]
  },
  assignedToEmail: {
    anyOf: [
      { type: "string", format: "email" },
      { type: "null" }
    ]
  },
  type: {
    type: "string",
    enum: ACTIVITY_TYPES
  },
  dueDate: { type: "string", format: "date-time" },
  status: {
    type: "string",
    enum: ACTIVITY_STATUSES
  },
  priority: {
    type: "string",
    enum: ACTIVITY_PRIORITIES
  },
  notes: nullableString,
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" }
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
    clientId: { type: "string", minLength: 1 },
    assignedTo: { type: "string", minLength: 1 },
    status: { type: "string", enum: ACTIVITY_STATUSES },
    priority: { type: "string", enum: ACTIVITY_PRIORITIES },
    dateFrom: { type: "string", format: "date-time" },
    dateTo: { type: "string", format: "date-time" },
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
    title: activityProperties.title,
    clientId: activityProperties.clientId,
    assignedTo: activityProperties.assignedTo,
    type: activityProperties.type,
    dueDate: activityProperties.dueDate,
    status: activityProperties.status,
    priority: activityProperties.priority,
    notes: activityProperties.notes
  },
  required: ["title", "clientId", "type", "dueDate", "status", "priority"],
  additionalProperties: false
} as const;

const activityUpdateBody = {
  type: "object",
  properties: {
    title: activityProperties.title,
    clientId: activityProperties.clientId,
    assignedTo: activityProperties.assignedTo,
    type: activityProperties.type,
    dueDate: activityProperties.dueDate,
    status: activityProperties.status,
    priority: activityProperties.priority,
    notes: activityProperties.notes
  },
  additionalProperties: false,
  minProperties: 1
} as const;

export const leadListSchema: FastifySchema = {
  tags: ["crm"],
  summary: "List leads",
  description: "Vraća listu leadova sa opcionim filtriranjem po statusu, izvoru i pretrazi. Podržava paginaciju.",
  querystring: leadListQuery,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: leadProperties,
          required: ["id", "name", "email", "status", "source", "createdAt"],
          additionalProperties: false
        }
      }),
      description: "Lista leadova"
    }
  }
};

export const leadDetailSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Get lead by ID",
  description: "Vraća detaljne informacije o konkretnom leadu.",
  params: idParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: leadProperties,
        required: ["id", "name", "email", "status", "source", "createdAt"],
        additionalProperties: false
      }),
      description: "Detalji leada"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Lead nije pronađen"
    }
  }
};

export const leadCreateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Create a new lead",
  description: "Kreira novi lead u CRM sistemu. Email mora biti validan i jedinstven.",
  body: leadCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: leadProperties,
        required: ["id", "name", "email", "status", "source", "createdAt"],
        additionalProperties: false
      }),
      description: "Kreiran lead"
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

export const leadUpdateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Update a lead",
  description: "Ažurira postojeći lead. Mogu se ažurirati svi podaci osim ID-a.",
  params: idParams,
  body: leadUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: leadProperties,
        required: ["id", "name", "email", "status", "source", "createdAt"],
        additionalProperties: false
      }),
      description: "Ažuriran lead"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Lead nije pronađen"
    }
  }
};

export const leadDeleteSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Delete a lead",
  description: "Briše lead iz sistema. Operacija je trajna.",
  params: idParams,
  response: {
    204: {
      type: "null",
      description: "Lead je uspešno obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Lead nije pronađen"
    }
  }
};

export const opportunityListSchema: FastifySchema = {
  tags: ["crm"],
  summary: "List opportunities",
  description: "Vraća listu prodajnih prilika sa opcionim filtriranjem po fazi, nalogu i verovatnoći. Podržava paginaciju.",
  querystring: opportunityListQuery,
  response: {
    200: {
      ...dataEnvelope({
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
      }),
      description: "Lista prodajnih prilika"
    }
  }
};

export const opportunityDetailSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Get opportunity by ID",
  description: "Vraća detaljne informacije o konkretnoj prodajnoj prilici.",
  params: idParams,
  response: {
    200: {
      ...dataEnvelope({
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
      }),
      description: "Detalji prodajne prilike"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Prodajna prilika nije pronađena"
    }
  }
};

export const opportunityCreateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Create a new opportunity",
  description: "Kreira novu prodajnu priliku povezanu sa nalogom. Vrednost i verovatnoća su obavezni.",
  body: opportunityCreateBody,
  response: {
    201: {
      ...dataEnvelope({
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
      }),
      description: "Kreirana prodajna prilika"
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

export const opportunityUpdateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Update an opportunity",
  description: "Ažurira postojeću prodajnu priliku. Mogu se ažurirati svi podaci osim ID-a.",
  params: idParams,
  body: opportunityUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
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
      }),
      description: "Ažurirana prodajna prilika"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Prodajna prilika nije pronađena"
    }
  }
};

export const opportunityDeleteSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Delete an opportunity",
  description: "Briše prodajnu priliku iz sistema. Operacija je trajna.",
  params: idParams,
  response: {
    204: {
      type: "null",
      description: "Prodajna prilika je uspešno obrisana"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Prodajna prilika nije pronađena"
    }
  }
};

export const activityListSchema: FastifySchema = {
  tags: ["crm"],
  summary: "List activities",
  description: "Vraća listu aktivnosti sa opcionim filtriranjem po tipu, klijentu, dodeljenom korisniku, statusu, prioritetu i datumu. Podržava paginaciju.",
  querystring: activityListQuery,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: {
          type: "object",
          properties: activityProperties,
          required: [
            "id",
            "title",
            "clientId",
            "clientName",
            "type",
            "dueDate",
            "status",
            "priority",
            "createdAt",
            "updatedAt"
          ],
          additionalProperties: false
        }
      }),
      description: "Lista aktivnosti"
    }
  }
};

export const activityDetailSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Get activity by ID",
  description: "Vraća detaljne informacije o konkretnoj aktivnosti.",
  params: idParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: activityProperties,
        required: [
          "id",
          "title",
          "clientId",
          "clientName",
          "type",
          "dueDate",
          "status",
          "priority",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Detalji aktivnosti"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Aktivnost nije pronađena"
    }
  }
};

export const activityCreateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Create a new activity",
  description: "Kreira novu aktivnost povezanu sa klijentom. Tip, status i prioritet su obavezni.",
  body: activityCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: activityProperties,
        required: [
          "id",
          "title",
          "clientId",
          "clientName",
          "type",
          "dueDate",
          "status",
          "priority",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Kreirana aktivnost"
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

export const activityUpdateSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Update an activity",
  description: "Ažurira postojeću aktivnost. Mogu se ažurirati svi podaci osim ID-a.",
  params: idParams,
  body: activityUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: activityProperties,
        required: [
          "id",
          "title",
          "clientId",
          "clientName",
          "type",
          "dueDate",
          "status",
          "priority",
          "createdAt",
          "updatedAt"
        ],
        additionalProperties: false
      }),
      description: "Ažurirana aktivnost"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Aktivnost nije pronađena"
    }
  }
};

export const activityDeleteSchema: FastifySchema = {
  tags: ["crm"],
  summary: "Delete an activity",
  description: "Briše aktivnost iz sistema. Operacija je trajna.",
  params: idParams,
  response: {
    204: {
      type: "null",
      description: "Aktivnost je uspešno obrisana"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Aktivnost nije pronađena"
    }
  }
};


