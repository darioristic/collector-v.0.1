import type { FastifyPluginAsync } from "fastify";

const metricsRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		"/metrics",
		{
			schema: {
				tags: ["monitoring"],
				summary: "Get application metrics",
				description: "Returns current metrics snapshot including response times, cache statistics, and database query metrics",
				response: {
					200: {
						type: "object",
						properties: {
							responseTimes: {
								type: "object",
								properties: {
									total: { type: "number" },
									average: { type: "number" },
									p50: { type: "number" },
									p95: { type: "number" },
									p99: { type: "number" },
									min: { type: "number" },
									max: { type: "number" },
									byRoute: { type: "object" }
								}
							},
							cache: {
								type: "object",
								properties: {
									hits: { type: "number" },
									misses: { type: "number" },
									hitRate: { type: "number" }
								}
							},
							database: {
								type: "object",
								properties: {
									queries: { type: "number" },
									averageQueryTime: { type: "number" },
									totalQueryTime: { type: "number" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			if (!fastify.hasDecorator("metrics")) {
				return reply.status(503).send({ error: "Metrics service not available" });
			}

			const metrics = (fastify as any).metrics;
			const snapshot = metrics.getMetrics();

			return reply.status(200).send(snapshot);
		}
	);

	fastify.post(
		"/metrics/reset",
		{
			schema: {
				tags: ["monitoring"],
				summary: "Reset metrics",
				description: "Resets all collected metrics",
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" }
						}
					}
				}
			}
		},
		async (request, reply) => {
			if (!fastify.hasDecorator("metrics")) {
				return reply.status(503).send({ error: "Metrics service not available" });
			}

			const metrics = (fastify as any).metrics;
			metrics.reset();

			return reply.status(200).send({ success: true, message: "Metrics reset successfully" });
		}
	);
};

export default metricsRoutes;

