import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema/notifications.js";
// Cache keys
const CACHE_PREFIX = "notifications:";
const getNotificationsListCacheKey = (userId, companyId, limit, offset, unreadOnly) => `${CACHE_PREFIX}list:${userId}:${companyId}:${limit}:${offset}:${unreadOnly}`;
const getUnreadCountCacheKey = (userId, companyId) => `${CACHE_PREFIX}unread:${userId}:${companyId}`;
// Global cache instance (will be set by server)
let globalCache = null;
export const setCacheService = (cache) => {
    globalCache = cache;
};
export async function listNotifications(userId, companyId, limit = 50, offset = 0, unreadOnly = false, cache) {
    const cacheService = cache || globalCache;
    const cacheKey = getNotificationsListCacheKey(userId, companyId, limit, offset, unreadOnly);
    // Try cache first
    if (cacheService) {
        const cached = await cacheService.get(cacheKey);
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
        .where(and(eq(notifications.recipientId, userId), eq(notifications.companyId, companyId), eq(notifications.read, false)));
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
export async function getUnreadCount(userId, companyId, cache) {
    const cacheService = cache || globalCache;
    const cacheKey = getUnreadCountCacheKey(userId, companyId);
    // Try cache first
    if (cacheService) {
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
    }
    const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.recipientId, userId), eq(notifications.companyId, companyId), eq(notifications.read, false)));
    const notificationCount = result?.count ?? 0;
    // Cache result (TTL: 30 seconds - unread count changes frequently)
    if (cacheService) {
        await cacheService.set(cacheKey, notificationCount, { ttl: 30 });
    }
    return notificationCount;
}
export async function markAsRead(userId, companyId, ids, cache) {
    const cacheService = cache || globalCache;
    const result = await db
        .update(notifications)
        .set({ read: true })
        .where(and(inArray(notifications.id, ids), eq(notifications.recipientId, userId), eq(notifications.companyId, companyId)))
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
export async function createNotification(companyId, recipientId, title, message, type = "info", link, cache) {
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
