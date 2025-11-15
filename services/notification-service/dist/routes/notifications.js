import { createNotification, getUnreadCount, listNotifications, markAsRead, } from "../lib/repository.js";
import { authMiddleware } from "../lib/auth.js";
const notificationsRoutes = async (fastify) => {
    fastify.addHook("onRequest", authMiddleware);
    fastify.get("/", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const limit = parseInt(request.query.limit || "50", 10);
        const offset = parseInt(request.query.offset || "0", 10);
        const unreadOnly = request.query.unreadOnly === "true";
        try {
            const cache = fastify.cache;
            const result = await listNotifications(request.user.userId, request.user.companyId, limit, offset, unreadOnly, cache);
            return reply.send(result);
        }
        catch (error) {
            request.log.error(error, "Failed to fetch notifications");
            return reply.code(500).send({ error: "Failed to fetch notifications" });
        }
    });
    fastify.get("/unread-count", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        try {
            const cache = fastify.cache;
            const count = await getUnreadCount(request.user.userId, request.user.companyId, cache);
            return reply.send({ count });
        }
        catch (error) {
            request.log.error(error, "Failed to fetch unread count");
            return reply.code(500).send({ error: "Failed to fetch unread count" });
        }
    });
    fastify.patch("/mark-read", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const { ids } = request.body;
        if (!ids || ids.length === 0) {
            return reply.code(400).send({ error: "No notification IDs provided" });
        }
        try {
            const cache = fastify.cache;
            const result = await markAsRead(request.user.userId, request.user.companyId, ids, cache);
            // Emit socket event
            const io = fastify.io;
            if (io) {
                const cache = fastify.cache;
                io.to(`user:${request.user.userId}`).emit("notification:read", {
                    updatedIds: result.updatedIds,
                    unreadCount: await getUnreadCount(request.user.userId, request.user.companyId, cache),
                });
            }
            return reply.send({
                success: result.success,
                updated: result.updated,
                updatedIds: result.updatedIds,
                unreadCount: await getUnreadCount(request.user.userId, request.user.companyId, cache),
            });
        }
        catch (error) {
            request.log.error(error, "Failed to mark notifications as read");
            return reply.code(500).send({ error: "Failed to mark notifications as read" });
        }
    });
    fastify.post("/", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const { title, message, type = "info", link, recipientId } = request.body;
        try {
            const cache = fastify.cache;
            const notification = await createNotification(request.user.companyId, recipientId, title, message, type, link, cache);
            // Emit socket event
            const io = fastify.io;
            if (io) {
                io.to(`user:${recipientId}`).emit("notification:new", notification);
            }
            return reply.code(201).send(notification);
        }
        catch (error) {
            request.log.error(error, "Failed to create notification");
            return reply.code(500).send({ error: "Failed to create notification" });
        }
    });
};
export default notificationsRoutes;
