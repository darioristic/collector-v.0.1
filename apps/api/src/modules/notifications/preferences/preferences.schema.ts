import type { FastifySchema } from "fastify";

const notificationPreferenceTypeEnum = [
  "invoice",
  "payment",
  "transaction",
  "daily_summary",
  "quote",
  "deal",
  "project",
  "task",
  "system",
] as const;

// GET /notifications/preferences
export const getPreferencesSchema: FastifySchema = {
  summary: "Get user notification preferences",
  description: "Get all or filtered notification preferences for the current user",
  tags: ["notifications"],
  querystring: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: notificationPreferenceTypeEnum,
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      oneOf: [
        {
          // Single preference
          properties: {
            userId: { type: "string", format: "uuid" },
            notificationType: {
              type: "string",
              enum: notificationPreferenceTypeEnum,
            },
            emailEnabled: { type: "boolean" },
            inAppEnabled: { type: "boolean" },
          },
          required: ["userId", "notificationType", "emailEnabled", "inAppEnabled"],
        },
        {
          // All preferences
          properties: {
            preferences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { type: "string", format: "uuid" },
                  notificationType: {
                    type: "string",
                    enum: notificationPreferenceTypeEnum,
                  },
                  emailEnabled: { type: "boolean" },
                  inAppEnabled: { type: "boolean" },
                },
                required: [
                  "userId",
                  "notificationType",
                  "emailEnabled",
                  "inAppEnabled",
                ],
              },
            },
          },
          required: ["preferences"],
        },
      ],
    },
  },
};

// PATCH /notifications/preferences
export const updatePreferencesSchema: FastifySchema = {
  summary: "Update user notification preferences",
  description: "Update one or more notification preferences for the current user",
  tags: ["notifications"],
  body: {
    type: "object",
    properties: {
      preferences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            notificationType: {
              type: "string",
              enum: notificationPreferenceTypeEnum,
            },
            emailEnabled: { type: "boolean" },
            inAppEnabled: { type: "boolean" },
          },
          required: ["notificationType", "emailEnabled", "inAppEnabled"],
        },
        minItems: 1,
      },
    },
    required: ["preferences"],
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        preferences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              userId: { type: "string", format: "uuid" },
              notificationType: {
                type: "string",
                enum: notificationPreferenceTypeEnum,
              },
              emailEnabled: { type: "boolean" },
              inAppEnabled: { type: "boolean" },
            },
            required: [
              "userId",
              "notificationType",
              "emailEnabled",
              "inAppEnabled",
            ],
          },
        },
      },
      required: ["preferences"],
    },
  },
};

// GET /notifications/preferences/:type
export const getPreferenceByTypeSchema: FastifySchema = {
  summary: "Get notification preference by type",
  description: "Get notification preference for a specific type for the current user",
  tags: ["notifications"],
  params: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: notificationPreferenceTypeEnum,
      },
    },
    required: ["type"],
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        userId: { type: "string", format: "uuid" },
        notificationType: {
          type: "string",
          enum: notificationPreferenceTypeEnum,
        },
        emailEnabled: { type: "boolean" },
        inAppEnabled: { type: "boolean" },
      },
      required: ["userId", "notificationType", "emailEnabled", "inAppEnabled"],
    },
  },
};

