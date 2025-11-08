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

const idParams = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 }
  },
  required: ["id"],
  additionalProperties: false
} as const;

const projectProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  accountId: { type: "string", minLength: 1 },
  status: {
    type: "string",
    enum: ["draft", "inProgress", "completed", "onHold", "cancelled"]
  },
  startDate: { type: "string", format: "date" },
  endDate: { type: "string", format: "date" }
} as const;

const taskProperties = {
  id: { type: "string", minLength: 1 },
  projectId: { type: "string", minLength: 1 },
  title: { type: "string", minLength: 1 },
  assignee: { type: "string", minLength: 1 },
  dueDate: { type: "string", format: "date" },
  status: {
    type: "string",
    enum: ["todo", "inProgress", "done", "blocked"]
  }
} as const;

const milestoneProperties = {
  id: { type: "string", minLength: 1 },
  projectId: { type: "string", minLength: 1 },
  title: { type: "string", minLength: 1 },
  targetDate: { type: "string", format: "date" },
  completed: { type: "boolean" }
} as const;

export type Project = {
  id: string;
  name: string;
  accountId: string;
  status: "draft" | "inProgress" | "completed" | "onHold" | "cancelled";
  startDate: string;
  endDate: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: "todo" | "inProgress" | "done" | "blocked";
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  targetDate: string;
  completed: boolean;
};

export type CreateProjectBody = Pick<Project, "name" | "accountId" | "status" | "startDate" | "endDate">;
export type CreateTaskBody = Pick<Task, "title" | "assignee" | "dueDate" | "status">;
export type CreateMilestoneBody = Pick<Milestone, "title" | "targetDate" | "completed">;

export const listProjectsSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: projectProperties,
        required: Object.keys(projectProperties),
        additionalProperties: false
      }
    })
  }
};

export const createProjectSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      name: projectProperties.name,
      accountId: projectProperties.accountId,
      status: projectProperties.status,
      startDate: projectProperties.startDate,
      endDate: projectProperties.endDate
    },
    required: ["name", "accountId", "status", "startDate", "endDate"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: projectProperties,
      required: Object.keys(projectProperties),
      additionalProperties: false
    })
  }
};

export const listTasksSchema: FastifySchema = {
  params: idParams,
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: taskProperties,
        required: Object.keys(taskProperties),
        additionalProperties: false
      }
    })
  }
};

export const createTaskSchema: FastifySchema = {
  params: idParams,
  body: {
    type: "object",
    properties: {
      title: taskProperties.title,
      assignee: taskProperties.assignee,
      dueDate: taskProperties.dueDate,
      status: taskProperties.status
    },
    required: ["title", "assignee", "dueDate", "status"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: taskProperties,
      required: Object.keys(taskProperties),
      additionalProperties: false
    })
  }
};

export const listMilestonesSchema: FastifySchema = {
  params: idParams,
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: milestoneProperties,
        required: Object.keys(milestoneProperties),
        additionalProperties: false
      }
    })
  }
};

export const createMilestoneSchema: FastifySchema = {
  params: idParams,
  body: {
    type: "object",
    properties: {
      title: milestoneProperties.title,
      targetDate: milestoneProperties.targetDate,
      completed: milestoneProperties.completed
    },
    required: ["title", "targetDate", "completed"],
    additionalProperties: false
  },
  response: {
    201: dataEnvelope({
      type: "object",
      properties: milestoneProperties,
      required: Object.keys(milestoneProperties),
      additionalProperties: false
    })
  }
};


