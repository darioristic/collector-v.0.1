import { and, eq, inArray } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { teamchatUsers } from "../db/schema/teamchat.js";
import { authMiddleware } from "../lib/auth.js";

const usersRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", authMiddleware);

	// Get user status
	fastify.get<{ Params: { id: string } }>(
		"/:id/status",
		async (request, reply) => {
			if (!request.user) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const { id: userId } = request.params;

			try {
				const [user] = await db
					.select({
						id: teamchatUsers.id,
						status: teamchatUsers.status,
						email: teamchatUsers.email,
					})
					.from(teamchatUsers)
					.where(
						and(
							eq(teamchatUsers.id, userId),
							eq(teamchatUsers.companyId, request.user.companyId),
						),
					)
					.limit(1);

				if (!user) {
					return reply.code(404).send({ error: "User not found" });
				}

				return reply.send({
					userId: user.id,
					status: user.status,
				});
			} catch (error) {
				request.log.error(error, "Failed to fetch user status");
				return reply.code(500).send({ error: "Failed to fetch user status" });
			}
		},
	);

	// Get multiple users' status
	fastify.post<{ Body: { userIds: string[] } }>(
		"/status",
		async (request, reply) => {
			if (!request.user) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const body = request.body as { userIds?: string[] };

			if (!body || !Array.isArray(body.userIds) || body.userIds.length === 0) {
				return reply.code(400).send({ error: "userIds array is required" });
			}

			try {
				const users = await db
					.select({
						id: teamchatUsers.id,
						status: teamchatUsers.status,
						email: teamchatUsers.email,
					})
					.from(teamchatUsers)
					.where(
						and(
							eq(teamchatUsers.companyId, request.user.companyId),
							inArray(teamchatUsers.id, body.userIds),
						),
					);

				const statusMap = users.reduce(
					(acc, user) => {
						acc[user.id] = user.status;
						return acc;
					},
					{} as Record<string, string>,
				);

				return reply.send({ statuses: statusMap });
			} catch (error) {
				request.log.error(error, "Failed to fetch users status");
				return reply.code(500).send({ error: "Failed to fetch users status" });
			}
		},
	);
};

export default usersRoutes;
