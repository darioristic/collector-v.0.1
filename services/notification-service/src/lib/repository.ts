import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema/notifications.js";

export async function listNotifications(
  userId: string,
  companyId: string,
  limit = 50,
  offset = 0,
  unreadOnly = false,
) {
  const whereConditions = [
    eq(notifications.recipientId, userId),
    eq(notifications.companyId, companyId),
  ];

  if (unreadOnly) {
    whereConditions.push(eq(notifications.read, false));
  }

  const items = await db
    .select()
    .from(notifications)
    .where(and(...whereConditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(...whereConditions));

  const [unreadResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.companyId, companyId),
        eq(notifications.read, false),
      ),
    );

  return {
    notifications: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    total: totalResult?.count ?? 0,
    unreadCount: unreadResult?.count ?? 0,
  };
}

export async function getUnreadCount(userId: string, companyId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.companyId, companyId),
        eq(notifications.read, false),
      ),
    );

  return result?.count ?? 0;
}

export async function markAsRead(
  userId: string,
  companyId: string,
  ids: string[],
) {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        inArray(notifications.id, ids),
        eq(notifications.recipientId, userId),
        eq(notifications.companyId, companyId),
      ),
    )
    .returning();

  return {
    success: true,
    updated: result.length,
    updatedIds: result.map((r) => r.id),
  };
}

export async function createNotification(
  companyId: string,
  recipientId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
  link?: string,
) {
  const [notification] = await db
    .insert(notifications)
    .values({
      title,
      message,
      type,
      link: link ?? null,
      recipientId,
      companyId,
      read: false,
    })
    .returning();

  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

