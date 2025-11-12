import type { FastifyPluginAsync } from "fastify";
import { listDirectMessageTargets } from "../lib/teamchat-repository.js";
import { authMiddleware } from "../lib/auth.js";

const directMessagesRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", authMiddleware);

	fastify.get("/", async (request, reply) => {
		if (!request.user) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		try {
			const members = await listDirectMessageTargets(
				request.user.companyId,
				request.user.userId,
			);

			return reply.send({ members });
		} catch (error) {
			request.log.error(error, "Failed to fetch direct message targets");
			return reply.code(500).send({
				error: "Preuzimanje direktnih poruka nije uspelo.",
			});
		}
	});
};

export default directMessagesRoutes;

