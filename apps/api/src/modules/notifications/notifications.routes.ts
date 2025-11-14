import type { FastifyPluginAsync, RouteHandlerMethod } from "fastify";

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
  fastify.get(
    "/",
    { schema: listNotificationsSchema },
    listNotifications as RouteHandlerMethod
  );
  fastify.get(
    "/unread-count",
    { schema: unreadCountSchema },
    getUnreadCount as RouteHandlerMethod
  );
  fastify.patch(
    "/mark-read",
    { schema: markAsReadSchema },
    markAsRead as RouteHandlerMethod
  );
  fastify.post(
    "/",
    { schema: createNotificationSchema },
    createNotification as RouteHandlerMethod
  );
};

export default notificationsRoutes;