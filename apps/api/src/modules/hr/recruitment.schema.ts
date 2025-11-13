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

// Candidate schemas
const candidateProperties = {
  id: { type: "string", format: "uuid" },
  firstName: { type: "string" },
  lastName: { type: "string" },
  email: { type: "string", format: "email" },
  phone: { type: ["string", "null"] },
  position: { type: "string" },
  status: {
    type: "string",
    enum: ["applied", "screening", "interview", "offer", "hired", "rejected"]
  },
  source: { type: ["string", "null"] },
  resumeUrl: { type: ["string", "null"] },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" }
} as const;

const candidateCreateBody = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string", format: "email" },
    phone: { type: ["string", "null"] },
    position: { type: "string" },
    status: {
      type: "string",
      enum: ["applied", "screening", "interview", "offer", "hired", "rejected"]
    },
    source: { type: ["string", "null"] },
    resumeUrl: { type: ["string", "null"] }
  },
  required: ["firstName", "lastName", "email", "position"],
  additionalProperties: false
} as const;

const candidateUpdateBody = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string", format: "email" },
    phone: { type: ["string", "null"] },
    position: { type: "string" },
    status: {
      type: "string",
      enum: ["applied", "screening", "interview", "offer", "hired", "rejected"]
    },
    source: { type: ["string", "null"] },
    resumeUrl: { type: ["string", "null"] }
  },
  additionalProperties: false
} as const;

// Interview schemas
const interviewProperties = {
  id: { type: "string", format: "uuid" },
  candidateId: { type: "string", format: "uuid" },
  candidateName: { type: "string" },
  interviewerId: { type: ["string", "null"], format: "uuid" },
  interviewerName: { type: ["string", "null"] },
  scheduledAt: { type: "string", format: "date-time" },
  type: {
    type: "string",
    enum: ["phone", "video", "onsite", "technical", "hr"]
  },
  status: {
    type: "string",
    enum: ["scheduled", "completed", "cancelled", "rescheduled"]
  },
  notes: { type: ["string", "null"] },
  rating: { type: ["integer", "null"], minimum: 1, maximum: 5 },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" }
} as const;

const interviewCreateBody = {
  type: "object",
  properties: {
    candidateId: { type: "string", format: "uuid" },
    interviewerId: { type: ["string", "null"], format: "uuid" },
    scheduledAt: { type: "string", format: "date-time" },
    type: {
      type: "string",
      enum: ["phone", "video", "onsite", "technical", "hr"]
    },
    status: {
      type: "string",
      enum: ["scheduled", "completed", "cancelled", "rescheduled"]
    },
    notes: { type: ["string", "null"] },
    rating: { type: ["integer", "null"], minimum: 1, maximum: 5 }
  },
  required: ["candidateId", "scheduledAt", "type"],
  additionalProperties: false
} as const;

const interviewUpdateBody = {
  type: "object",
  properties: {
    interviewerId: { type: ["string", "null"], format: "uuid" },
    scheduledAt: { type: "string", format: "date-time" },
    type: {
      type: "string",
      enum: ["phone", "video", "onsite", "technical", "hr"]
    },
    status: {
      type: "string",
      enum: ["scheduled", "completed", "cancelled", "rescheduled"]
    },
    notes: { type: ["string", "null"] },
    rating: { type: ["integer", "null"], minimum: 1, maximum: 5 }
  },
  additionalProperties: false
} as const;

// Candidate schemas
export const candidateListSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "List candidates",
  description: "Vraća listu kandidata sa filtriranjem i paginacijom.",
  querystring: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["applied", "screening", "interview", "offer", "hired", "rejected"]
      },
      position: { type: "string" },
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
          properties: candidateProperties,
          required: ["id", "firstName", "lastName", "email", "position", "status", "createdAt", "updatedAt"],
          additionalProperties: false
        }
      }),
      description: "Lista kandidata"
    }
  }
};

export const candidateGetSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Get candidate by ID",
  description: "Vraća kandidata po ID-u.",
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
        properties: candidateProperties,
        required: ["id", "firstName", "lastName", "email", "position", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Kandidat"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Kandidat nije pronađen"
    }
  }
};

export const candidateCreateSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Create a new candidate",
  description: "Kreira novog kandidata.",
  body: candidateCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: candidateProperties,
        required: ["id", "firstName", "lastName", "email", "position", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Kreiran kandidat"
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

export const candidateUpdateSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Update candidate",
  description: "Ažurira postojećeg kandidata.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: candidateUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: candidateProperties,
        required: ["id", "firstName", "lastName", "email", "position", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Ažuriran kandidat"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Kandidat nije pronađen"
    }
  }
};

export const candidateDeleteSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Delete candidate",
  description: "Briše kandidata.",
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
      description: "Kandidat je obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Kandidat nije pronađen"
    }
  }
};

// Interview schemas
export const interviewListSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "List interviews",
  description: "Vraća listu intervjua sa filtriranjem i paginacijom.",
  querystring: {
    type: "object",
    properties: {
      candidateId: { type: "string", format: "uuid" },
      interviewerId: { type: "string", format: "uuid" },
      status: {
        type: "string",
        enum: ["scheduled", "completed", "cancelled", "rescheduled"]
      },
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
          properties: interviewProperties,
          required: ["id", "candidateId", "scheduledAt", "type", "status", "createdAt", "updatedAt"],
          additionalProperties: false
        }
      }),
      description: "Lista intervjua"
    }
  }
};

export const interviewGetSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Get interview by ID",
  description: "Vraća intervju po ID-u.",
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
        properties: interviewProperties,
        required: ["id", "candidateId", "scheduledAt", "type", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Intervju"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Intervju nije pronađen"
    }
  }
};

export const interviewCreateSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Create a new interview",
  description: "Kreira novi intervju.",
  body: interviewCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: interviewProperties,
        required: ["id", "candidateId", "scheduledAt", "type", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Kreiran intervju"
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

export const interviewUpdateSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Update interview",
  description: "Ažurira postojeći intervju.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: interviewUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: interviewProperties,
        required: ["id", "candidateId", "scheduledAt", "type", "status", "createdAt", "updatedAt"],
        additionalProperties: false
      }),
      description: "Ažuriran intervju"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Intervju nije pronađen"
    }
  }
};

export const interviewDeleteSchema: FastifySchema = {
  tags: ["hr-recruitment"],
  summary: "Delete interview",
  description: "Briše intervju.",
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
      description: "Intervju je obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Intervju nije pronađen"
    }
  }
};

