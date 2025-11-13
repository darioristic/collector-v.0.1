import type { FastifyPluginAsync } from "fastify";
import {
	findOrCreateConversation,
	getConversations,
} from "../lib/repository.js";
import { authMiddleware } from "../lib/auth.js";

const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", authMiddleware);

	fastify.get("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		try {
			const cache = (fastify as any).cache;
			const conversations = await getConversations({
				companyId: request.user.companyId,
				userId: request.user.userId,
				cache,
			});

			return reply.send({ conversations });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			request.log.error({ err: error, companyId: request.user.companyId, userId: request.user.userId }, "Failed to fetch conversations");
			return reply.code(500).send({ 
				error: "Failed to fetch conversations",
				details: process.env.NODE_ENV === "development" ? errorMessage : undefined
			});
		}
	});

	fastify.post("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const body = request.body as { targetUserId?: string };

		if (!body || typeof body !== "object" || !body.targetUserId) {
			return reply.code(400).send({
				error: "Nevalidni podaci. targetUserId je obavezan.",
			});
		}

		try {
			const cache = (fastify as any).cache;
			const conversation = await findOrCreateConversation({
				companyId: request.user.companyId,
				currentUserId: request.user.userId,
				targetUserId: body.targetUserId,
				cache,
			});

			return reply.send({ conversation });
		} catch (error) {
			request.log.error(error, "Failed to create conversation");
			return reply.code(500).send({ error: "Kreiranje konverzacije nije uspelo." });
		}
	});
};

export default conversationsRoutes;

