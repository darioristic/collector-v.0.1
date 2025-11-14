import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";

/**
 * Rate Limiting Plugin
 *
 * Provides protection against brute force attacks and DDoS.
 * Uses Redis for distributed rate limiting across multiple instances.
 */
const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
	// Get Redis client from cache service if available
  const redis = fastify.hasDecorator("cache")
    ? fastify.cache?.getRedisClient?.()
    : undefined;

	await fastify.register(rateLimit, {
		global: true, // Apply to all routes by default
		max: 100, // Max 100 requests
		timeWindow: "15 minutes", // Per 15 minutes
		cache: 10000, // Keep 10000 rate limit entries in memory
		redis: redis, // Use Redis for distributed rate limiting
		skipOnError: false, // Don't skip rate limit on Redis error
		continueExceeding: true, // Continue tracking even after limit exceeded
		enableDraftSpec: true, // Enable draft spec headers
		errorResponseBuilder: (request, context) => {
			return {
				statusCode: 429,
				error: "RATE_LIMIT_EXCEEDED",
				message: `Previše zahteva. Pokušajte ponovo za ${Math.ceil(context.ttl / 1000)} sekundi.`,
			};
		},
		onExceeding: (request, key) => {
			fastify.log.warn(
				{
					ip: request.ip,
					url: request.url,
					key,
				},
				"Rate limit approaching for IP",
			);
		},
		onExceeded: (request, key) => {
			fastify.log.error(
				{
					ip: request.ip,
					url: request.url,
					key,
				},
				"Rate limit exceeded for IP",
			);
		},
	});

	fastify.log.info("Rate limiting plugin registered");
};

export default rateLimitPlugin;