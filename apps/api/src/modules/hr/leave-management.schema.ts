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

const leaveRequestProperties = {
  id: { type: "string", format: "uuid" },
  employeeId: { type: "string", format: "uuid" },
  employeeName: { type: "string" },
  startDate: { type: "string", format: "date-time" },
  endDate: { type: "string", format: "date-time" },
  reason: { type: ["string", "null"] },
  status: { type: "string" },
  approvedBy: { type: ["string", "null"], format: "uuid" },
  approverName: { type: ["string", "null"] },
  createdAt: { type: "string", format: "date-time" }
} as const;

const leaveRequestCreateBody = {
  type: "object",
  properties: {
    employeeId: { type: "string", format: "uuid" },
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    reason: { type: ["string", "null"] },
    status: { type: "string" }
  },
  required: ["employeeId", "startDate", "endDate"],
  additionalProperties: false
} as const;

const leaveRequestUpdateBody = {
  type: "object",
  properties: {
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    reason: { type: ["string", "null"] },
    status: { type: "string" },
    approvedBy: { type: ["string", "null"], format: "uuid" }
  },
  additionalProperties: false
} as const;

export const leaveRequestListSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "List leave requests",
  description: "Vraća listu zahteva za odmor sa filtriranjem i paginacijom.",
  querystring: {
    type: "object",
    properties: {
      employeeId: { type: "string", format: "uuid" },
      status: { type: "string" },
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
          properties: leaveRequestProperties,
          required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
          additionalProperties: false
        }
      }),
      description: "Lista zahteva za odmor"
    }
  }
};

export const leaveRequestGetSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Get leave request by ID",
  description: "Vraća zahtev za odmor po ID-u.",
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
        properties: leaveRequestProperties,
        required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
        additionalProperties: false
      }),
      description: "Zahtev za odmor"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Zahtev za odmor nije pronađen"
    }
  }
};

export const leaveRequestCreateSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Create a new leave request",
  description: "Kreira novi zahtev za odmor.",
  body: leaveRequestCreateBody,
  response: {
    201: {
      ...dataEnvelope({
        type: "object",
        properties: leaveRequestProperties,
        required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
        additionalProperties: false
      }),
      description: "Kreiran zahtev za odmor"
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

export const leaveRequestUpdateSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Update leave request",
  description: "Ažurira postojeći zahtev za odmor.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  body: leaveRequestUpdateBody,
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: leaveRequestProperties,
        required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
        additionalProperties: false
      }),
      description: "Ažuriran zahtev za odmor"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Zahtev za odmor nije pronađen"
    }
  }
};

export const leaveRequestDeleteSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Delete leave request",
  description: "Briše zahtev za odmor.",
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
      description: "Zahtev za odmor je obrisan"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Zahtev za odmor nije pronađen"
    }
  }
};

export const leaveRequestApproveSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Approve leave request",
  description: "Odobrava zahtev za odmor.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  querystring: {
    type: "object",
    properties: {
      approverId: { type: "string", format: "uuid" }
    },
    required: ["approverId"],
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: leaveRequestProperties,
        required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
        additionalProperties: false
      }),
      description: "Odobren zahtev za odmor"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Zahtev za odmor nije pronađen"
    }
  }
};

export const leaveRequestRejectSchema: FastifySchema = {
  tags: ["hr-leave-management"],
  summary: "Reject leave request",
  description: "Odbija zahtev za odmor.",
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }
    },
    required: ["id"],
    additionalProperties: false
  },
  querystring: {
    type: "object",
    properties: {
      approverId: { type: "string", format: "uuid" }
    },
    required: ["approverId"],
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope({
        type: "object",
        properties: leaveRequestProperties,
        required: ["id", "employeeId", "startDate", "endDate", "status", "createdAt"],
        additionalProperties: false
      }),
      description: "Odbijen zahtev za odmor"
    },
    404: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      description: "Zahtev za odmor nije pronađen"
    }
  }
};

