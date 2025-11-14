import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema/notifications.js";
import type { CacheService } from "./cache.service.js";

// Cache keys
const CACHE_PREFIX = "notifications:";
const getNotificationsListCacheKey = (userId: string, companyId: string, limit: number, offset: number, unreadOnly: boolean) =>
	`${CACHE_PREFIX}list:${userId}:${companyId}:${limit}:${offset}:${unreadOnly}`;
const getUnreadCountCacheKey = (userId: string, companyId: string) =>
	`${CACHE_PREFIX}unread:${userId}:${companyId}`;

// Global cache instance (will be set by server)
let globalCache: CacheService | null = null;

export const setCacheService = (cache: CacheService | null) => {
	globalCache = cache;
};

export async function listNotifications(
  userId: string,
  companyId: string,
  limit = 50,
  offset = 0,
  unreadOnly = false,
  cache?: CacheService | null,
) {
  const cacheService = cache || globalCache;
  const cacheKey = getNotificationsListCacheKey(userId, companyId, limit, offset, unreadOnly);

  // Try cache first
  if (cacheService) {
    const cached = await cacheService.get<{
      notifications: Array<{ id: string; [key: string]: unknown }>;
      total: number;
      unreadCount: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }
  }

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

  const result = {
    notifications: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    total: totalResult?.count ?? 0,
    unreadCount: unreadResult?.count ?? 0,
  };

  // Cache result (TTL: 1 minute - notifications change frequently)
  if (cacheService) {
    await cacheService.set(cacheKey, result, { ttl: 60 });
  }

  return result;
}

export async function getUnreadCount(userId: string, companyId: string, cache?: CacheService | null) {
  const cacheService = cache || globalCache;
  const cacheKey = getUnreadCountCacheKey(userId, companyId);

  // Try cache first
  if (cacheService) {
    const cached = await cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

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

  const notificationCount = result?.count ?? 0;

  // Cache result (TTL: 30 seconds - unread count changes frequently)
  if (cacheService) {
    await cacheService.set(cacheKey, notificationCount, { ttl: 30 });
  }

  return notificationCount;
}

export async function markAsRead(
  userId: string,
  companyId: string,
  ids: string[],
  cache?: CacheService | null,
) {
  const cacheService = cache || globalCache;
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

  // Invalidate cache when notifications are marked as read
  if (cacheService) {
    await cacheService.deletePattern(`${CACHE_PREFIX}list:${userId}:${companyId}:*`);
    await cacheService.delete(getUnreadCountCacheKey(userId, companyId));
  }

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
  cache?: CacheService | null,
) {
  const cacheService = cache || globalCache;
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

  // Invalidate cache when new notification is created
  if (cacheService) {
    await cacheService.deletePattern(`${CACHE_PREFIX}list:${recipientId}:${companyId}:*`);
    await cacheService.delete(getUnreadCountCacheKey(recipientId, companyId));
  }

  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

