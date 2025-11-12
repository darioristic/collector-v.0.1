import type { FastifyReply, FastifyRequest } from "fastify";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import type { AuthenticatedRequest } from "../../types/auth";
import { notifications } from "../../db/schema/notifications.schema";

type ListNotificationsQuery = {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
};

type MarkAsReadBody = {
  ids: string[];
};

type CreateNotificationBody = {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
  recipientId: string;
};

// GET /notifications - List notifications for current user
export async function listNotifications(
  request: FastifyRequest<{
    Querystring: ListNotificationsQuery;
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const { limit = 50, offset = 0, unreadOnly = false } = request.query;
  const userId = request.user.id;
  const companyId = request.user.companyId;

  try {
    // Build where condition
    const whereConditions = [
      eq(notifications.recipientId, userId),
      eq(notifications.companyId, companyId)
    ];

    if (unreadOnly) {
      whereConditions.push(eq(notifications.read, false));
    }

    // Get notifications
    const items = await request.server.db
      .select()
      .from(notifications)
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await request.server.db
      .select({ count: count() })
      .from(notifications)
      .where(and(...whereConditions));

    // Get unread count
    const [unreadResult] = await request.server.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.companyId, companyId),
          eq(notifications.read, false)
        )
      );

    return reply.status(200).send({
      notifications: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      })),
      total: totalResult?.count ?? 0,
      unreadCount: unreadResult?.count ?? 0
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch notifications");
    return reply.status(500).send({ error: "Failed to fetch notifications" });
  }
}

// GET /notifications/unread-count - Get unread count
export async function getUnreadCount(
  request: FastifyRequest & AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const companyId = request.user.companyId;

  try {
    const [result] = await request.server.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.companyId, companyId),
          eq(notifications.read, false)
        )
      );

    return reply.status(200).send({
      count: result?.count ?? 0
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch unread count");
    return reply.status(500).send({ error: "Failed to fetch unread count" });
  }
}

// PATCH /notifications/mark-read - Mark notifications as read
export async function markAsRead(
  request: FastifyRequest<{
    Body: MarkAsReadBody;
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const { ids } = request.body;
  const userId = request.user.id;
  const companyId = request.user.companyId;

  if (!ids || ids.length === 0) {
    return reply.status(400).send({ error: "No notification IDs provided" });
  }

  try {
    const result = await request.server.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          inArray(notifications.id, ids),
          eq(notifications.recipientId, userId),
          eq(notifications.companyId, companyId)
        )
      )
      .returning();

    return reply.status(200).send({
      success: true,
      updated: result.length
    });
  } catch (error) {
    request.log.error(error, "Failed to mark notifications as read");
    return reply.status(500).send({ error: "Failed to mark notifications as read" });
  }
}

// POST /notifications - Create notification
export async function createNotification(
  request: FastifyRequest<{
    Body: CreateNotificationBody;
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const { title, message, type = "info", link, recipientId } = request.body;
  const companyId = request.user.companyId;

  try {
    const [notification] = await request.server.db
      .insert(notifications)
      .values({
        title,
        message,
        type,
        link: link ?? null,
        recipientId,
        companyId,
        read: false
      })
      .returning();

    return reply.status(201).send({
      ...notification,
      createdAt: notification.createdAt.toISOString()
    });
  } catch (error) {
    request.log.error(error, "Failed to create notification");
    return reply.status(500).send({ error: "Failed to create notification" });
  }
}