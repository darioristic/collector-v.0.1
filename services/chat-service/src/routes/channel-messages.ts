import type { FastifyPluginAsync } from "fastify";
import {
	createMessage as createTeamChatMessage,
	getChannelMessages,
} from "../lib/teamchat-repository.js";
import { authMiddleware } from "../lib/auth.js";

const channelMessagesRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", authMiddleware);

	fastify.get<{
		Querystring: { channelId?: string; limit?: string };
	}>("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const channelId = request.query.channelId;
		const limit = parseInt(request.query.limit || "50", 10);

		if (!channelId) {
			return reply.code(400).send({
				error: "channelId je obavezan.",
			});
		}

		try {
			const messages = await getChannelMessages(
				channelId,
				request.user.userId,
				limit,
			);

			return reply.send({ messages });
		} catch (error) {
			request.log.error(error, "Failed to fetch messages");
			return reply.code(500).send({ error: "Preuzimanje poruka nije uspelo." });
		}
	});

	fastify.post<{
		Body: {
			channelId?: string;
			content?: string;
			fileUrl?: string;
		};
	}>("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const body = request.body;

		if (!body || typeof body !== "object") {
			return reply.code(400).send({ error: "Nevalidni podaci." });
		}

		if (!body.channelId) {
			return reply.code(400).send({
				error: "channelId je obavezan.",
			});
		}

		try {
			const message = await createTeamChatMessage(
				body.channelId,
				request.user.userId,
				body.content || null,
				body.fileUrl || null,
			);

			// Emit socket event
			const io = (fastify as any).io;
			if (io) {
				io.to(`channel:${body.channelId}`).emit("message:new", message);
				io.to(`channel:${body.channelId}`).emit("channel:updated", {
					id: body.channelId,
				});

				// Get channel members for notification
				const { db } = await import("../db/index.js");
				const { teamchatChannelMembers } = await import("../db/schema/teamchat.js");
				const { eq } = await import("drizzle-orm");
				const members = await db
					.select({ userId: teamchatChannelMembers.userId })
					.from(teamchatChannelMembers)
					.where(eq(teamchatChannelMembers.channelId, body.channelId));

				// Publish to Redis for notification service
				const redis = (fastify as any).redis;
				if (redis) {
					await redis.publish(
						"events:new_message",
						JSON.stringify({
							channelId: body.channelId,
							message,
							memberIds: members.map((m) => m.userId),
							companyId: request.user.companyId,
						}),
					);
				}
			}

			return reply.send({ message });
		} catch (error) {
			request.log.error(error, "Failed to create message");
			return reply.code(500).send({ error: "Slanje poruke nije uspelo." });
		}
	});
};

export default channelMessagesRoutes;

