import { and, eq, inArray } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { teamchatUsers } from "../db/schema/teamchat.js";
import { authMiddleware } from "../lib/auth.js";
const CACHE_PREFIX = "chat:";
const getUserStatusCacheKey2 = (companyId: string, userId: string) =>
	`${CACHE_PREFIX}user:status:${companyId}:${userId}`;

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
				const cache = (fastify as any).cache;
				const cacheKey = getUserStatusCacheKey2(request.user.companyId, userId);

				// Try cache first
				if (cache) {
					const cached = await cache.get<{ userId: string; status: string }>(cacheKey);
					if (cached) {
						return reply.send(cached);
					}
				}

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

				const result = {
					userId: user.id,
					status: user.status,
				};

				// Cache result (TTL: 1 minute - status changes frequently)
				if (cache) {
					await cache.set(cacheKey, result, { ttl: 60 });
				}

				return reply.send(result);
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
				const cache = (fastify as any).cache;
				const cacheKeys = body.userIds.map((id) => getUserStatusCacheKey2(request.user.companyId, id));

				// Try to get from cache first
				const cachedStatuses: Record<string, string> = {};
				const uncachedIds: string[] = [];

				if (cache) {
					for (let i = 0; i < body.userIds.length; i++) {
						const cached = await cache.get<{ userId: string; status: string }>(cacheKeys[i]);
						if (cached) {
							cachedStatuses[body.userIds[i]] = cached.status;
						} else {
							uncachedIds.push(body.userIds[i]);
						}
					}
				} else {
					uncachedIds.push(...body.userIds);
				}

				// Fetch uncached users
				const users = uncachedIds.length > 0 ? await db
					.select({
						id: teamchatUsers.id,
						status: teamchatUsers.status,
						email: teamchatUsers.email,
					})
					.from(teamchatUsers)
					.where(
						and(
							eq(teamchatUsers.companyId, request.user.companyId),
							inArray(teamchatUsers.id, uncachedIds),
						),
					) : [];

				// Combine cached and fetched statuses
				const statusMap: Record<string, string> = { ...cachedStatuses };
				for (const user of users) {
					statusMap[user.id] = user.status;
					// Cache fetched status
					if (cache) {
						const key = getUserStatusCacheKey2(request.user.companyId, user.id);
						await cache.set(key, { userId: user.id, status: user.status }, { ttl: 60 });
					}
				}

				return reply.send({ statuses: statusMap });
			} catch (error) {
				request.log.error(error, "Failed to fetch users status");
				return reply.code(500).send({ error: "Failed to fetch users status" });
			}
		},
	);
};

export default usersRoutes;
