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

const teamEntityParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    teamId: uuidSchema
  },
  required: ["id", "teamId"],
  additionalProperties: false
} as const;

const timeEntryParams = {
  type: "object",
  properties: {
    id: uuidSchema,
    entryId: uuidSchema
  },
  required: ["id", "entryId"],
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

const teamSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    projectId: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    goal: nullableString,
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["id", "projectId", "name", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const teamMemberSchema = {
  type: "object",
  properties: {
    projectId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    teamId: nullableString,
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

const timeEntrySchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    projectId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    taskId: nullableString,
    hours: { type: "number" },
    date: { type: "string" },
    description: nullableString,
    userName: nullableString,
    userEmail: nullableString,
    taskTitle: nullableString,
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  },
  required: ["id", "projectId", "userId", "hours", "date", "createdAt", "updatedAt"],
  additionalProperties: false
} as const;

const budgetSummarySchema = {
  type: "object",
  properties: {
    currency: { type: "string" },
    total: { type: "number" },
    spent: { type: "number" },
    remaining: { type: "number" },
    totalHours: { type: "number" },
    categories: {
      type: "array",
      items: budgetCategorySchema
    }
  },
  required: ["currency", "total", "spent", "remaining", "totalHours", "categories"],
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
    teams: {
      type: "array",
      items: teamSchema
    },
    team: {
      type: "array",
      items: teamMemberSchema
    },
    timeEntries: {
      type: "array",
      items: timeEntrySchema
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
    "teams",
    "team",
    "timeEntries",
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
  teamId: nullableString,
  role: nullableString
} as const;

const teamEntityPayloadProperties = {
  name: { type: "string", minLength: 1 },
  goal: nullableString
} as const;

const timeEntryPayloadProperties = {
  userId: { type: "string", minLength: 1 },
  taskId: nullableString,
  hours: { type: "number", minimum: 0 },
  date: { type: "string" },
  description: nullableString
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
  tags: ["projects"],
  summary: "List projects",
  description: "Vraća listu svih projekata sa osnovnim informacijama uključujući status, napredak i vlasnika.",
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: projectSummarySchema
      }),
      description: "Lista projekata"
    },
    ...defaultErrorResponses
  }
};

export const createProjectSchema: FastifySchema = {
  tags: ["projects"],
  summary: "Create a new project",
  description: "Kreira novi projekt. Naziv je obavezan. Opciono se mogu postaviti budžet, datumi i vlasnik.",
  body: {
    type: "object",
    properties: projectPayloadProperties,
    required: ["name"],
    additionalProperties: false
  },
  response: {
    201: {
      ...dataEnvelope(projectDetailsSchema),
      description: "Kreiran projekt"
    },
    ...defaultErrorResponses
  }
};

export const getProjectSchema: FastifySchema = {
  tags: ["projects"],
  summary: "Get project by ID",
  description: "Vraća detaljne informacije o projektu uključujući zadatke, timeline, tim i budžet.",
  params: projectParams,
  response: {
    200: {
      ...dataEnvelope(projectDetailsSchema),
      description: "Detalji projekta"
    },
    ...notFoundErrorResponse
  }
};

export const updateProjectSchema: FastifySchema = {
  tags: ["projects"],
  summary: "Update a project",
  description: "Ažurira postojeći projekt. Mogu se ažurirati svi podaci osim ID-a.",
  params: projectParams,
  body: {
    type: "object",
    properties: projectPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope(projectDetailsSchema),
      description: "Ažuriran projekt"
    },
    ...notFoundErrorResponse
  }
};

export const deleteProjectSchema: FastifySchema = {
  tags: ["projects"],
  summary: "Delete a project",
  description: "Briše projekt iz sistema. Operacija je trajna i briše sve povezane zadatke i podatke.",
  params: projectParams,
  response: {
    204: {
      type: "null",
      description: "Projekt je uspešno obrisan"
    },
    ...notFoundErrorResponse
  }
};

export const listTasksSchema: FastifySchema = {
  tags: ["project-tasks"],
  summary: "List project tasks",
  description: "Vraća listu svih zadataka za konkretan projekt.",
  params: projectParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: taskSchema
      }),
      description: "Lista zadataka"
    },
    ...defaultErrorResponses
  }
};

export const createTaskSchema: FastifySchema = {
  tags: ["project-tasks"],
  summary: "Create a new task",
  description: "Kreira novi zadatak unutar projekta. Naslov je obavezan.",
  params: projectParams,
  body: {
    type: "object",
    properties: taskPayloadProperties,
    required: ["title"],
    additionalProperties: false
  },
  response: {
    201: {
      ...dataEnvelope(taskSchema),
      description: "Kreiran zadatak"
    },
    ...notFoundErrorResponse
  }
};

export const updateTaskSchema: FastifySchema = {
  tags: ["project-tasks"],
  summary: "Update a task",
  description: "Ažurira postojeći zadatak. Mogu se ažurirati svi podaci osim ID-a.",
  params: taskParams,
  body: {
    type: "object",
    properties: taskPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope(taskSchema),
      description: "Ažuriran zadatak"
    },
    ...notFoundErrorResponse
  }
};

export const deleteTaskSchema: FastifySchema = {
  tags: ["project-tasks"],
  summary: "Delete a task",
  description: "Briše zadatak iz projekta. Operacija je trajna.",
  params: taskParams,
  response: {
    204: {
      type: "null",
      description: "Zadatak je uspešno obrisan"
    },
    ...notFoundErrorResponse
  }
};

export const listTimelineSchema: FastifySchema = {
  tags: ["project-milestones"],
  summary: "List project timeline events",
  description: "Vraća listu svih timeline događaja (milještoka) za konkretan projekt.",
  params: projectParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: timelineEventSchema
      }),
      description: "Lista timeline događaja"
    },
    ...defaultErrorResponses
  }
};

export const createTimelineSchema: FastifySchema = {
  tags: ["project-milestones"],
  summary: "Create a new timeline event",
  description: "Kreira novi timeline događaj (milještok) unutar projekta. Naslov je obavezan.",
  params: projectParams,
  body: {
    type: "object",
    properties: timelinePayloadProperties,
    required: ["title"],
    additionalProperties: false
  },
  response: {
    201: {
      ...dataEnvelope(timelineEventSchema),
      description: "Kreiran timeline događaj"
    },
    ...notFoundErrorResponse
  }
};

export const updateTimelineSchema: FastifySchema = {
  tags: ["project-milestones"],
  summary: "Update a timeline event",
  description: "Ažurira postojeći timeline događaj. Mogu se ažurirati svi podaci osim ID-a.",
  params: timelineParams,
  body: {
    type: "object",
    properties: timelinePayloadProperties,
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope(timelineEventSchema),
      description: "Ažuriran timeline događaj"
    },
    ...notFoundErrorResponse
  }
};

export const deleteTimelineSchema: FastifySchema = {
  tags: ["project-milestones"],
  summary: "Delete a timeline event",
  description: "Briše timeline događaj iz projekta. Operacija je trajna.",
  params: timelineParams,
  response: {
    204: {
      type: "null",
      description: "Timeline događaj je uspešno obrisan"
    },
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

export const listTeamsSchema: FastifySchema = {
  tags: ["project-teams"],
  summary: "List project teams",
  description: "Vraća listu svih timova za konkretan projekt.",
  params: projectParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: teamSchema
      }),
      description: "Lista timova"
    },
    ...defaultErrorResponses
  }
};

export const createTeamSchema: FastifySchema = {
  tags: ["project-teams"],
  summary: "Create a new team",
  description: "Kreira novi tim unutar projekta. Ime tima je obavezno.",
  params: projectParams,
  body: {
    type: "object",
    properties: teamEntityPayloadProperties,
    required: ["name"],
    additionalProperties: false
  },
  response: {
    201: {
      ...dataEnvelope(teamSchema),
      description: "Kreiran tim"
    },
    ...notFoundErrorResponse
  }
};

export const updateTeamSchema: FastifySchema = {
  tags: ["project-teams"],
  summary: "Update a team",
  description: "Ažurira postojeći tim. Mogu se ažurirati svi podaci osim ID-a.",
  params: teamEntityParams,
  body: {
    type: "object",
    properties: teamEntityPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope(teamSchema),
      description: "Ažuriran tim"
    },
    ...notFoundErrorResponse
  }
};

export const deleteTeamSchema: FastifySchema = {
  tags: ["project-teams"],
  summary: "Delete a team",
  description: "Briše tim iz projekta. Operacija je trajna.",
  params: teamEntityParams,
  response: {
    204: {
      type: "null",
      description: "Tim je uspešno obrisan"
    },
    ...notFoundErrorResponse
  }
};

export const listTimeEntriesSchema: FastifySchema = {
  tags: ["project-time-entries"],
  summary: "List project time entries",
  description: "Vraća listu svih unosa vremena za konkretan projekt.",
  params: projectParams,
  response: {
    200: {
      ...dataEnvelope({
        type: "array",
        items: timeEntrySchema
      }),
      description: "Lista unosa vremena"
    },
    ...defaultErrorResponses
  }
};

export const createTimeEntrySchema: FastifySchema = {
  tags: ["project-time-entries"],
  summary: "Create a new time entry",
  description: "Kreira novi unos vremena unutar projekta. Korisnik, sati i datum su obavezni.",
  params: projectParams,
  body: {
    type: "object",
    properties: timeEntryPayloadProperties,
    required: ["userId", "hours", "date"],
    additionalProperties: false
  },
  response: {
    201: {
      ...dataEnvelope(timeEntrySchema),
      description: "Kreiran unos vremena"
    },
    ...notFoundErrorResponse
  }
};

export const updateTimeEntrySchema: FastifySchema = {
  tags: ["project-time-entries"],
  summary: "Update a time entry",
  description: "Ažurira postojeći unos vremena. Mogu se ažurirati svi podaci osim ID-a.",
  params: timeEntryParams,
  body: {
    type: "object",
    properties: timeEntryPayloadProperties,
    additionalProperties: false
  },
  response: {
    200: {
      ...dataEnvelope(timeEntrySchema),
      description: "Ažuriran unos vremena"
    },
    ...notFoundErrorResponse
  }
};

export const deleteTimeEntrySchema: FastifySchema = {
  tags: ["project-time-entries"],
  summary: "Delete a time entry",
  description: "Briše unos vremena iz projekta. Operacija je trajna.",
  params: timeEntryParams,
  response: {
    204: {
      type: "null",
      description: "Unos vremena je uspešno obrisan"
    },
    ...notFoundErrorResponse
  }
};
