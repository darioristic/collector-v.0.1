import type { FastifySchema } from "fastify";

const dataEnvelope = (itemsSchema: object) => ({
  type: "object",
  properties: {
    data: itemsSchema
  },
  required: ["data"],
  additionalProperties: false
}) as const;

const userProperties = {
  id: { type: "string", minLength: 1 },
  username: { type: "string", minLength: 1 },
  email: { type: "string", format: "email" },
  role: { type: "string", minLength: 1 },
  active: { type: "boolean" }
} as const;

const userCreateBody = {
  type: "object",
  properties: {
    username: userProperties.username,
    email: userProperties.email,
    role: userProperties.role,
    active: userProperties.active
  },
  required: ["username", "email", "role"],
  additionalProperties: false
} as const;

const permissionProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  description: { type: "string", minLength: 1 },
  roleId: { type: "string", minLength: 1 }
} as const;

const integrationProperties = {
  id: { type: "string", minLength: 1 },
  name: { type: "string", minLength: 1 },
  type: { type: "string", minLength: 1 },
  status: {
    type: "string",
    enum: ["connected", "disconnected", "error"]
  },
  connectedAt: { type: "string", format: "date-time" }
} as const;

export const userListSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: userProperties,
        required: ["id", "username", "email", "role", "active"],
        additionalProperties: false
      }
    })
  }
};

export const userCreateSchema: FastifySchema = {
  body: userCreateBody,
  response: {
    201: dataEnvelope({
      type: "object",
      properties: userProperties,
      required: ["id", "username", "email", "role", "active"],
      additionalProperties: false
    })
  }
};

export const permissionListSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: permissionProperties,
        required: ["id", "name", "description", "roleId"],
        additionalProperties: false
      }
    })
  }
};

export const integrationListSchema: FastifySchema = {
  response: {
    200: dataEnvelope({
      type: "array",
      items: {
        type: "object",
        properties: integrationProperties,
        required: ["id", "name", "type", "status", "connectedAt"],
        additionalProperties: false
      }
    })
  }
};

export type SettingsUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
};

export type CreateUserInput = {
  username: string;
  email: string;
  role: string;
  active?: boolean;
};

export type SettingsPermission = {
  id: string;
  name: string;
  description: string;
  roleId: string;
};

export type SettingsIntegration = {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  connectedAt: string;
};

export const mockUsers: SettingsUser[] = [
  {
    id: "user_admin",
    username: "admin",
    email: "admin@example.com",
    role: "administrator",
    active: true
  },
  {
    id: "user_manager",
    username: "manager",
    email: "manager@example.com",
    role: "manager",
    active: true
  },
  {
    id: "user_agent",
    username: "agent",
    email: "agent@example.com",
    role: "agent",
    active: false
  }
];

export const mockPermissions: SettingsPermission[] = [
  {
    id: "perm_admin_all",
    name: "Admin Access",
    description: "Full access to all settings and modules.",
    roleId: "administrator"
  },
  {
    id: "perm_manager_users",
    name: "Manage Users",
    description: "Can create and edit users within assigned teams.",
    roleId: "manager"
  },
  {
    id: "perm_agent_view",
    name: "Agent View",
    description: "Read-only access to assigned customer records.",
    roleId: "agent"
  }
];

export const mockIntegrations: SettingsIntegration[] = [
  {
    id: "integration_google",
    name: "Google Workspace",
    type: "google",
    status: "connected",
    connectedAt: "2025-01-12T09:30:00.000Z"
  },
  {
    id: "integration_outlook",
    name: "Microsoft Outlook",
    type: "outlook",
    status: "connected",
    connectedAt: "2025-02-03T11:45:00.000Z"
  },
  {
    id: "integration_slack",
    name: "Slack",
    type: "slack",
    status: "disconnected",
    connectedAt: "2025-05-27T14:20:00.000Z"
  }
];


