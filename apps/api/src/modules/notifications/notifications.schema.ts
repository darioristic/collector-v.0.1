import type { FastifySchema } from "fastify";

const notificationProperties = {
  id: { type: "string", format: "uuid" },
  title: { type: "string", minLength: 1 },
  message: { type: "string", minLength: 1 },
  type: {
    type: "string",
    enum: ["info", "success", "warning", "error"]
  },
  link: { type: "string", nullable: true },
  read: { type: "boolean" },
  recipientId: { type: "string", format: "uuid" },
  companyId: { type: "string", format: "uuid" },
  createdAt: { type: "string", format: "date-time" }
} as const;

// GET /notifications - List notifications
export const listNotificationsSchema: FastifySchema = {
  summary: "List user notifications",
  description: "Get paginated list of notifications for the current user",
  tags: ["notifications"],
  querystring: {
    type: "object",
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      offset: { type: "integer", minimum: 0, default: 0 },
      unreadOnly: { type: "boolean", default: false }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        notifications: {
          type: "array",
          items: {
            type: "object",
            properties: notificationProperties,
            required: ["id", "title", "message", "type", "read", "createdAt"]
          }
        },
        total: { type: "integer", minimum: 0 },
        unreadCount: { type: "integer", minimum: 0 }
      },
      required: ["notifications", "total", "unreadCount"]
    }
  }
};

// GET /notifications/unread-count - Get unread count
export const unreadCountSchema: FastifySchema = {
  summary: "Get unread notifications count",
  description: "Get the count of unread notifications for the current user",
  tags: ["notifications"],
  response: {
    200: {
      type: "object",
      properties: {
        count: { type: "integer", minimum: 0 }
      },
      required: ["count"]
    }
  }
};

// PATCH /notifications/mark-read - Mark notifications as read
export const markAsReadSchema: FastifySchema = {
  summary: "Mark notifications as read",
  description: "Mark one or more notifications as read",
  tags: ["notifications"],
  body: {
    type: "object",
    properties: {
      ids: {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1
      }
    },
    required: ["ids"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        updated: { type: "integer", minimum: 0 }
      },
      required: ["success", "updated"]
    }
  }
};

// POST /notifications - Create notification
export const createNotificationSchema: FastifySchema = {
  summary: "Create a notification",
  description: "Create a new notification for a user",
  tags: ["notifications"],
  body: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 255 },
      message: { type: "string", minLength: 1 },
      type: {
        type: "string",
        enum: ["info", "success", "warning", "error"]
      },
      link: { type: "string", format: "uri" },
      recipientId: { type: "string", format: "uuid" }
    },
    required: ["title", "message", "recipientId"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: notificationProperties,
      required: ["id", "title", "message", "type", "read", "recipientId", "companyId", "createdAt"]
    }
  }
};