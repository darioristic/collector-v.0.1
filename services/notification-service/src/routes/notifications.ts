import type { FastifyPluginAsync } from "fastify";
import {
  createNotification,
  getUnreadCount,
  listNotifications,
  markAsRead,
} from "../lib/repository.js";
import { authMiddleware } from "../lib/auth.js";

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", authMiddleware);

  fastify.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      unreadOnly?: string;
    };
  }>("/", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const limit = parseInt(request.query.limit || "50", 10);
    const offset = parseInt(request.query.offset || "0", 10);
    const unreadOnly = request.query.unreadOnly === "true";

    try {
      const result = await listNotifications(
        request.user.userId,
        request.user.companyId,
        limit,
        offset,
        unreadOnly,
      );

      return reply.send(result);
    } catch (error) {
      request.log.error(error, "Failed to fetch notifications");
      return reply.code(500).send({ error: "Failed to fetch notifications" });
    }
  });

  fastify.get("/unread-count", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    try {
      const count = await getUnreadCount(
        request.user.userId,
        request.user.companyId,
      );

      return reply.send({ count });
    } catch (error) {
      request.log.error(error, "Failed to fetch unread count");
      return reply.code(500).send({ error: "Failed to fetch unread count" });
    }
  });

  fastify.patch<{
    Body: { ids: string[] };
  }>("/mark-read", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { ids } = request.body;

    if (!ids || ids.length === 0) {
      return reply.code(400).send({ error: "No notification IDs provided" });
    }

    try {
      const result = await markAsRead(
        request.user.userId,
        request.user.companyId,
        ids,
      );

      // Emit socket event
      const io = (fastify as any).io;
      if (io) {
        io.to(`user:${request.user.userId}`).emit("notification:read", {
          updatedIds: result.updatedIds,
          unreadCount: await getUnreadCount(
            request.user.userId,
            request.user.companyId,
          ),
        });
      }

      return reply.send({
        success: result.success,
        updated: result.updated,
        updatedIds: result.updatedIds,
        unreadCount: await getUnreadCount(
          request.user.userId,
          request.user.companyId,
        ),
      });
    } catch (error) {
      request.log.error(error, "Failed to mark notifications as read");
      return reply.code(500).send({ error: "Failed to mark notifications as read" });
    }
  });

  fastify.post<{
    Body: {
      title: string;
      message: string;
      type?: "info" | "success" | "warning" | "error";
      link?: string;
      recipientId: string;
    };
  }>("/", async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { title, message, type = "info", link, recipientId } = request.body;

    try {
      const notification = await createNotification(
        request.user.companyId,
        recipientId,
        title,
        message,
        type,
        link,
      );

      // Emit socket event
      const io = (fastify as any).io;
      if (io) {
        io.to(`user:${recipientId}`).emit("notification:new", notification);
      }

      return reply.code(201).send(notification);
    } catch (error) {
      request.log.error(error, "Failed to create notification");
      return reply.code(500).send({ error: "Failed to create notification" });
    }
  });
};

export default notificationsRoutes;

