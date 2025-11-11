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

const httpErrorSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" },
    details: {}
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: true
} as const;

const defaultErrorResponses = {
  400: httpErrorSchema,
  500: httpErrorSchema
} as const;

const notFoundErrorResponse = {
  ...defaultErrorResponses,
  404: httpErrorSchema
} as const;

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] } as const;

const uuidSchema = {
  type: "string",
  pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
} as const;

const projectParams = {
  type: "object",
  properties: {
    id: uuidSchema
  },
  required: ["id"],
  additionalProperties: false
} as const;

const taskParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    taskId: uuidSchema
  },
  required: ["id", "taskId"],
  additionalProperties: false
} as const;

const timelineParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    eventId: uuidSchema
  },
  required: ["id", "eventId"],
  additionalProperties: false
} as const;

const teamParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    userId: uuidSchema
  },
  required: ["id", "userId"],
  additionalProperties: false
} as const;

const categoryParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    categoryId: uuidSchema
  },
  required: ["id", "categoryId"],
  additionalProperties: false
} as const;

const ownerSchema = {
  anyOf: [
    {
      type: "object",
      properties: {
        id: nullableString,
        name: nullableString,
        email: nullableString
      },
      required: ["id", "name", "email"],
      additionalProperties: false
    },
    { type: "null" }
  ]
} as const;

const projectSummarySchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    description: nullableString,
    customer: nullableString,
    status: {
      type: "string",
      enum: ["planned", "active", "on_hold", "completed"]
    },
    statusLabel: { type: "string" },
    startDate: nullableString,
    dueDate: nullableString,
    progress: { type: "number" },
    totalTasks: { type: "number" },
    completedTasks: { type: "number" },
    remainingDays: nullableNumber,
    owner: ownerSchema
  },
  required: [
    "id",
    "name",
    "description",
    "customer",
    "status",
    "statusLabel",
    "startDate",
    "dueDate",
    "progress",
    "totalTasks",
    "completedTasks",
    "remainingDays",
    "owner"
  ],
  additionalProperties: false
} as const;

const taskSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    projectId: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    description: nullableString,
    status: {
      type: "string",
      enum: ["todo", "in_progress", "blocked", "done"]
    },
    dueDate: nullableString,
    assignee: ownerSchema,
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: [
    "id",
    "projectId",
    "title",
    "description",
    "status",
    "dueDate",
    "assignee",
    "createdAt",
    "updatedAt"
  ],
  additionalProperties: false
} as const;

const timelineEventSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    projectId: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    description: nullableString,
    date: nullableString,
    status: {
      type: "string",
      enum: ["completed", "in_progress", "upcoming"]
    },
    createdAt: { type: "string" }
  },
  required: ["id", "projectId", "title", "description", "date", "status", "createdAt"],
  additionalProperties: false
} as const;

const teamMemberSchema = {
  type: "object",
  properties: {
    projectId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    role: { type: "string" },
    name: nullableString,
    email: nullableString,
    addedAt: { type: "string" }
  },
  required: ["projectId", "userId", "role", "name", "email", "addedAt"],
  additionalProperties: false
} as const;

const budgetCategorySchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    projectId: { type: "string", minLength: 1 },
    category: { type: "string", minLength: 1 },
    allocated: { type: "number" },
    spent: { type: "number" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["id", "projectId", "category", "allocated", "spent", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const budgetSummarySchema = {
  type: "object",
  properties: {
    currency: { type: "string" },
    total: { type: "number" },
    spent: { type: "number" },
    remaining: { type: "number" },
    categories: {
      type: "array",
      items: budgetCategorySchema
    }
  },
  required: ["currency", "total", "spent", "remaining", "categories"],
  additionalProperties: false
} as const;

const projectDetailsSchema = {
  type: "object",
  properties: {
    ...projectSummarySchema.properties,
    budget: budgetSummarySchema,
    tasks: {
      type: "array",
      items: taskSchema
    },
    timeline: {
      type: "array",
      items: timelineEventSchema
    },
    team: {
      type: "array",
      items: teamMemberSchema
    },
    quickStats: {
      type: "object",
      properties: {
        totalTasks: { type: "number" },
        completedTasks: { type: "number" },
        remainingTasks: { type: "number" },
        remainingDays: nullableNumber
      },
      required: ["totalTasks", "completedTasks", "remainingTasks", "remainingDays"],
      additionalProperties: false
    }
  },
  required: [
    ...projectSummarySchema.required,
    "budget",
    "tasks",
    "timeline",
    "team",
    "quickStats"
  ],
  additionalProperties: false
} as const;

const projectPayloadProperties = {
  name: { type: "string", minLength: 1 },
  description: nullableString,
  customer: nullableString,
  status: {
    type: "string",
    enum: ["planned", "active", "on_hold", "completed"]
  },
  startDate: nullableString,
  dueDate: nullableString,
  ownerId: nullableString,
  accountId: nullableString,
  budget: {
    type: "object",
    properties: {
      total: nullableNumber,
      spent: nullableNumber,
      currency: nullableString
    },
    additionalProperties: false
  }
} as const;

const taskPayloadProperties = {
  title: { type: "string", minLength: 1 },
  description: nullableString,
  status: {
    type: "string",
    enum: ["todo", "in_progress", "blocked", "done"]
  },
  assigneeId: nullableString,
  dueDate: nullableString
} as const;

const timelinePayloadProperties = {
  title: { type: "string", minLength: 1 },
  description: nullableString,
  status: {
    type: "string",
    enum: ["completed", "in_progress", "upcoming"]
  },
  date: nullableString
} as const;

const teamPayloadProperties = {
  userId: { type: "string", minLength: 1 },
  role: nullableString
} as const;

const budgetPayloadProperties = {
  total: nullableNumber,
  spent: nullableNumber,
  currency: nullableString
} as const;

const budgetCategoryPayloadProperties = {
  category: { type: "string", minLength: 1 },
  allocated: nullableNumber,
  spent: nullableNumber
} as const;

export const listProjectsSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: projectSummarySchema
    }),
    ...defaultErrorResponses
  }
};

export const createProjectSchema: FastifySchema = {
  body: {
    type: "object",
    properties: projectPayloadProperties,
    required: ["name"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope(projectDetailsSchema),
    ...defaultErrorResponses
  }
};

export const getProjectSchema: FastifySchema = {
  params: projectParams,
  response: {
    200: dataEnvelope(projectDetailsSchema),
    ...notFoundErrorResponse
  }
};

export const updateProjectSchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: projectPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: dataEnvelope(projectDetailsSchema),
    ...notFoundErrorResponse
  }
};

export const deleteProjectSchema: FastifySchema = {
  params: projectParams,
  response: {
    204: { type: "null" },
    ...notFoundErrorResponse
  }
};

export const listTasksSchema: FastifySchema = {
  params: projectParams,
  response: {
    200: dataEnvelope({
      type: "array",
      items: taskSchema
    }),
    ...defaultErrorResponses
  }
};

export const createTaskSchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: taskPayloadProperties,
    required: ["title"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope(taskSchema),
    ...notFoundErrorResponse
  }
};

export const updateTaskSchema: FastifySchema = {
  params: taskParams,
  body: {
    type: "object",
    properties: taskPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: dataEnvelope(taskSchema),
    ...notFoundErrorResponse
  }
};

export const deleteTaskSchema: FastifySchema = {
  params: taskParams,
  response: {
    204: { type: "null" },
    ...notFoundErrorResponse
  }
};

export const listTimelineSchema: FastifySchema = {
  params: projectParams,
  response: {
    200: dataEnvelope({
      type: "array",
      items: timelineEventSchema
    }),
    ...defaultErrorResponses
  }
};

export const createTimelineSchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: timelinePayloadProperties,
    required: ["title"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope(timelineEventSchema),
    ...notFoundErrorResponse
  }
};

export const updateTimelineSchema: FastifySchema = {
  params: timelineParams,
  body: {
    type: "object",
    properties: timelinePayloadProperties,
    additionalProperties: false
  },
  response: {
    200: dataEnvelope(timelineEventSchema),
    ...notFoundErrorResponse
  }
};

export const deleteTimelineSchema: FastifySchema = {
  params: timelineParams,
  response: {
    204: { type: "null" },
    ...notFoundErrorResponse
  }
};

export const listTeamSchema: FastifySchema = {
  params: projectParams,
  response: {
    200: dataEnvelope({
      type: "array",
      items: teamMemberSchema
    }),
    ...defaultErrorResponses
  }
};

export const addTeamMemberSchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: teamPayloadProperties,
    required: ["userId"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope(teamMemberSchema),
    ...notFoundErrorResponse
  }
};

export const removeTeamMemberSchema: FastifySchema = {
  params: teamParams,
  response: {
    204: { type: "null" },
    ...notFoundErrorResponse
  }
};

export const getBudgetSchema: FastifySchema = {
  params: projectParams,
  response: {
    200: dataEnvelope(budgetSummarySchema),
    ...defaultErrorResponses
  }
};

export const updateBudgetSchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: budgetPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: dataEnvelope(budgetSummarySchema),
    ...notFoundErrorResponse
  }
};

export const createBudgetCategorySchema: FastifySchema = {
  params: projectParams,
  body: {
    type: "object",
    properties: budgetCategoryPayloadProperties,
    required: ["category"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope(budgetCategorySchema),
    ...notFoundErrorResponse
  }
};

export const updateBudgetCategorySchema: FastifySchema = {
  params: categoryParams,
  body: {
    type: "object",
    properties: budgetCategoryPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: dataEnvelope(budgetCategorySchema),
    ...notFoundErrorResponse
  }
};

export const deleteBudgetCategorySchema: FastifySchema = {
  params: categoryParams,
  response: {
    204: { type: "null" },
    ...notFoundErrorResponse
  }
};
