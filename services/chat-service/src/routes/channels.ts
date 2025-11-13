import type { FastifyPluginAsync } from "fastify";
import {
	listChannels,
	upsertDirectMessageChannel,
} from "../lib/teamchat-repository.js";
import { authMiddleware } from "../lib/auth.js";

const channelsRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", authMiddleware);

	fastify.get("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		try {
			const cache = (fastify as any).cache;
			const channels = await listChannels(
				request.user.companyId,
				request.user.userId,
				cache,
			);

			return reply.send({ channels });
		} catch (error) {
			request.log.error(error, "Failed to fetch channels");
			return reply.code(500).send({ error: "Preuzimanje kanala nije uspelo." });
		}
	});

	fastify.post<{
		Body: { targetUserId?: string };
	}>("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const body = request.body;

		if (!body || typeof body !== "object") {
			return reply.code(400).send({ error: "Nevalidni podaci." });
		}

		if (!body.targetUserId) {
			return reply.code(400).send({
				error: "Nevalidni podaci. targetUserId je obavezan.",
			});
		}

		try {
			const result = await upsertDirectMessageChannel(
				request.user.companyId,
				request.user.userId,
				body.targetUserId,
			);

			return reply.send(result);
		} catch (error) {
			request.log.error(error, "Failed to create channel");
			return reply.code(500).send({ error: "Kreiranje kanala nije uspelo." });
		}
	});
};

export default channelsRoutes;

