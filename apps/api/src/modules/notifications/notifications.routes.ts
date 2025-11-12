import type { FastifyPluginAsync } from "fastify";

import {
  createNotificationSchema,
  listNotificationsSchema,
  markAsReadSchema,
  unreadCountSchema
} from "./notifications.schema";
import {
  createNotification,
  getUnreadCount,
  listNotifications,
  markAsRead
} from "./notifications.controller";

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { schema: listNotificationsSchema }, listNotifications as any);
  fastify.get("/unread-count", { schema: unreadCountSchema }, getUnreadCount as any);
  fastify.patch("/mark-read", { schema: markAsReadSchema }, markAsRead as any);
  fastify.post("/", { schema: createNotificationSchema }, createNotification as any);
};

export default notificationsRoutes;