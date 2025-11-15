import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { isUuid } from "../lib/validation.js";
import type { RedisClientType } from "redis";
import type { Server as SocketIOServer } from "socket.io";
import { authMiddleware } from "../lib/auth.js";
import {
    createMessage,
    getConversationById,
    getConversationMessages,
    invalidateConversationCaches,
} from "../lib/repository.js";

interface FastifyWithSocket extends FastifyInstance {
	io?: SocketIOServer;
	redis?: RedisClientType;
}

const messagesRoutes: FastifyPluginAsync = async (fastify) => {

	fastify.addHook("preValidation", async (request, reply) => {
		const params: unknown = request.params;
		if (params && typeof params === "object" && "id" in (params as any)) {
			const id = (params as { id?: unknown }).id;
			if (typeof id === "string" && !isUuid(id)) {
				return reply.code(400).send({ error: "Nevalidan ID konverzacije." });
			}
		}
	});
	fastify.addHook("onRequest", authMiddleware);

	fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
		"/:id/messages",
		async (request, reply) => {
			if (!request.user) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const { id: conversationId } = request.params;
			if (!isUuid(conversationId)) {
				return reply.code(400).send({ error: "Nevalidan ID konverzacije." });
			}
			const limitParam = request.query.limit;
			const limit = limitParam ? parseInt(limitParam, 10) : 50;

			if (Number.isNaN(limit) || limit < 1 || limit > 100) {
				return reply.code(400).send({
					error: "Limit mora biti između 1 i 100.",
				});
			}

			try {
				const conversation = await getConversationById({
					conversationId,
					userId: request.user.userId,
				});

				if (!conversation) {
					return reply.code(404).send({
						error: "Konverzacija nije pronađena.",
					});
				}

				const messages = await getConversationMessages({
					conversationId,
					userId: request.user.userId,
					limit,
				});

				return reply.send({ messages });
			} catch (error) {
				request.log.error({ err: error, conversationId, userId: request.user.userId }, "Failed to fetch messages");
				return reply
					.code(500)
					.send({ error: "Preuzimanje poruka nije uspelo." });
			}
		},
	);

	fastify.post<{
		Params: { id: string };
		Body: {
			content?: string;
			type?: string;
			fileUrl?: string;
			fileMetadata?: string;
		};
	}>("/:id/messages", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const { id: conversationId } = request.params;
		const body = request.body;

		if (!body || typeof body !== "object") {
			return reply.code(400).send({ error: "Nevalidni podaci." });
		}

		const content = body.content?.trim() || null;
		const type = (body.type || "text") as
			| "text"
			| "file"
			| "image"
			| "video"
			| "sound";
		const fileUrl = body.fileUrl || null;
		const fileMetadata = body.fileMetadata || null;

		if (!content && !fileUrl) {
			return reply.code(400).send({
				error: "Poruka mora imati sadržaj ili fajl.",
			});
		}

		try {
			const conversation = await getConversationById({
				conversationId,
				userId: request.user.userId,
			});

			if (!conversation) {
				return reply.code(404).send({
					error: "Konverzacija nije pronađena.",
				});
			}

            const cache = (fastify as any).cache;
            const { db } = await import("../db/index.js");
            const { sql } = await import("drizzle-orm");
            const teamchatIdResult = await db.execute(sql`
                SELECT id FROM teamchat_users WHERE email = ${request.user.email} AND company_id = ${request.user.companyId} LIMIT 1
            `);
            let teamchatSenderId = (teamchatIdResult.rows[0] as { id: string } | undefined)?.id || null;
            if (!teamchatSenderId) {
                const { teamchatUsers } = await import("../db/schema/teamchat.js");
                const { and, eq } = await import("drizzle-orm");
                // Double-check by company/email then create
                const [existing] = await db
                    .select({ id: teamchatUsers.id })
                    .from(teamchatUsers)
                    .where(and(eq(teamchatUsers.companyId, request.user.companyId), eq(teamchatUsers.email, request.user.email)))
                    .limit(1);
                if (existing) {
                    teamchatSenderId = existing.id;
                } else {
                    const [created] = await db
                        .insert(teamchatUsers)
                        .values({
                            email: request.user.email,
                            firstName: request.user.email.split("@")[0] || "",
                            lastName: "",
                            companyId: request.user.companyId,
                            status: "offline",
                        })
                        .returning({ id: teamchatUsers.id });
                    teamchatSenderId = created?.id || request.user.userId;
                }
            }

            const message = await createMessage({
                conversationId,
                senderId: teamchatSenderId,
                content,
                type,
                fileUrl,
                fileMetadata,
                cache,
            });

			// Emit socket event
			const io = (fastify as FastifyWithSocket).io;
			const redis = (fastify as FastifyWithSocket).redis;

			if (io) {
				// Format message for Socket.IO emission
				const messagePayload = {
					id: message.id,
					conversationId: message.conversationId,
					senderId: message.senderId,
					content: message.content,
					type: message.type,
					status: message.status,
					fileUrl: message.fileUrl,
					fileMetadata: message.fileMetadata,
					readAt: message.readAt,
					createdAt: message.createdAt,
					updatedAt: message.updatedAt,
					sender: message.sender,
				};

				// Emit to conversation room
				io.to(`chat:${conversationId}`).emit("chat:message:new", {
					conversationId,
					message: messagePayload,
				});

				// Emit conversation update to all users in the conversation
				io.to(`chat:${conversationId}`).emit("chat:conversation:updated", {
					conversationId,
				});

				// Get conversation to find the other user
				const { getConversationById } = await import("../lib/repository.js");
                const conversation = await getConversationById({
                    conversationId,
                    userId: request.user.userId,
                });

				if (conversation) {
                    const myTeamchatId = teamchatSenderId;
                    const otherTeamchatId = conversation.userId1 === myTeamchatId ? conversation.userId2 : conversation.userId1;
                    // Resolve other user's users.id by email mapping
                    const otherUserResult = await db.execute(sql`
                        SELECT u.id as "userId"
                        FROM users u
                        INNER JOIN teamchat_users t ON t.email = u.email
                        WHERE t.id = ${otherTeamchatId}
                        LIMIT 1
                    `);
                    const otherUserId = (otherUserResult.rows[0] as { userId: string } | undefined)?.userId || null;

					// Check if other user is online
                    let isOtherUserOnline = false;
                    if (otherUserId) {
                        const otherUserSockets = await io.in(`user:${otherUserId}`).fetchSockets();
                        isOtherUserOnline = otherUserSockets.length > 0;
                    }

					// If other user is not online, send notification
					if (!isOtherUserOnline && redis) {
						// Get other user's status from database
						const { db } = await import("../db/index.js");
						const { sql } = await import("drizzle-orm");
                        const statusResult = await db.execute(sql`
                            SELECT status
                            FROM teamchat_users
                            WHERE id = ${otherTeamchatId}
                            LIMIT 1
                        `);

						const userStatus =
							(statusResult.rows[0] as { status: string } | undefined)
								?.status || "offline";

						// Publish to Redis for notification service
						await redis.publish(
							"events:new_message",
							JSON.stringify({
								conversationId,
								message,
								senderId: request.user.userId,
								recipientId: otherUserId,
								recipientStatus: userStatus,
								memberIds: [conversation.userId1, conversation.userId2],
								companyId: request.user.companyId,
								timestamp: new Date().toISOString(),
							}),
						);
					}
				}
			}

			return reply.send({ message });
		} catch (error) {
			request.log.error({ err: error, conversationId, userId: request.user.userId }, "Failed to create message");
			return reply.code(500).send({ error: "Slanje poruke nije uspelo." });
		}
	});

	// Mark messages as read
	fastify.put<{ Params: { id: string } }>(
		"/:id/messages/read",
		async (request, reply) => {
			if (!request.user) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const { id: conversationId } = request.params;
			if (!isUuid(conversationId)) {
				return reply.code(400).send({ error: "Nevalidan ID konverzacije." });
			}

			try {
				// Verify user is part of conversation
				const conversation = await getConversationById({
					conversationId,
					userId: request.user.userId,
				});

				if (!conversation) {
					return reply.code(404).send({
						error: "Konverzacija nije pronađena.",
					});
				}

				// Import db and sql
				const { db } = await import("../db/index.js");
				const { sql } = await import("drizzle-orm");

				// Mark all messages in conversation as read for current user
				// Resolve teamchat user id for current user (chat_messages.sender_id stores teamchat_users.id)
				const teamchatIdResult = await db.execute(sql`
					SELECT id FROM teamchat_users WHERE email = ${request.user.email} AND company_id = ${request.user.companyId} LIMIT 1
				`);
				const teamchatUserId = (teamchatIdResult.rows[0] as { id: string } | undefined)?.id || request.user.userId;

				await db.execute(sql`
					UPDATE chat_messages
					SET status = 'read',
						read_at = NOW(),
						updated_at = NOW()
					WHERE conversation_id = ${conversationId}
						AND sender_id != ${teamchatUserId}
						AND read_at IS NULL
				`);

				// Invalidate caches for both users in the conversation
				const cache = (fastify as any).cache;
				await invalidateConversationCaches({
					companyId: conversation.companyId,
					userId1: conversation.userId1,
					userId2: conversation.userId2,
					cache,
				});

				// Safeguard: backfill read_at for any pre-read messages missing timestamp (throttled)
				try {
					const throttleKey = `chat:readfix:${conversationId}`;
					const lastRun = cache ? await cache.get<number>(throttleKey) : null;
					const nowTs = Date.now();
					if (!lastRun || nowTs - lastRun > 60_000) {
						await db.execute(sql`
							UPDATE chat_messages
							SET read_at = NOW()
							WHERE conversation_id = ${conversationId}
								AND status = 'read'
								AND read_at IS NULL
						`);
						if (cache) {
							await cache.set(throttleKey, nowTs, { ttl: 60 });
						}
					}
				} catch (err) {
					request.log.warn({ err, conversationId }, "Safeguard read_at backfill failed (non-fatal)");
				}

				// Emit socket event for conversation update
				const io = (fastify as FastifyWithSocket).io;
				if (io) {
					io.to(`chat:${conversationId}`).emit("chat:conversation:updated", {
						conversationId,
					});
				}

				return reply.send({ success: true });
			} catch (error) {
				request.log.error({ err: error, conversationId, userId: request.user.userId }, "Failed to mark messages as read");
				return reply
					.code(500)
					.send({ error: "Označavanje poruka kao pročitanih nije uspelo." });
			}
		},
	);
};

export default messagesRoutes;
