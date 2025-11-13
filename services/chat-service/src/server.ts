import { createServer } from "node:http";
import corsPlugin from "@fastify/cors";
import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import Fastify, { type FastifyInstance } from "fastify";
import { createClient, type RedisClientType } from "redis";
import { Server as SocketIOServer } from "socket.io";
import channelMessagesRoutes from "./routes/channel-messages.js";
import channelsRoutes from "./routes/channels.js";
import conversationsRoutes from "./routes/conversations.js";
import messagesRoutes from "./routes/messages.js";
import usersRoutes from "./routes/users.js";
import { setupSocketHandlers } from "./socket/handler.js";
import { getCacheService, setCacheService } from "./lib/cache.service.js";
import { setCacheService as setRepositoryCache } from "./lib/repository.js";
import { setCacheService as setTeamchatRepositoryCache } from "./lib/teamchat-repository.js";

interface FastifyWithSocket extends FastifyInstance {
	io?: SocketIOServer;
	redis?: RedisClientType;
	cache?: ReturnType<typeof getCacheService>;
}

dotenv.config();

const port = Number(process.env.PORT || 4001);
const host = process.env.HOST || "0.0.0.0";

async function buildServer() {
	const fastify = Fastify({
		logger: {
			level: process.env.NODE_ENV === "production" ? "info" : "debug",
			transport:
				process.env.NODE_ENV === "production"
					? undefined
					: {
							target: "pino-pretty",
							options: {
								colorize: true,
							},
						},
		},
	});

	// CORS
	await fastify.register(corsPlugin, {
		origin:
			process.env.NODE_ENV === "production"
				? process.env.ALLOWED_ORIGINS?.split(",") || "*"
				: "*",
		credentials: true,
	});

	// Create HTTP server
	const httpServer = createServer();

	// Setup Redis
	const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
	console.log(`[chat-service] Connecting to Redis at ${redisUrl}...`);
	const pubClient = createClient({ url: redisUrl }) as RedisClientType;
	const subClient = pubClient.duplicate() as RedisClientType;
	
	pubClient.on("error", (err) => {
		console.error("[chat-service] Redis pub client error:", err);
	});
	
	subClient.on("error", (err) => {
		console.error("[chat-service] Redis sub client error:", err);
	});

	try {
		await Promise.all([pubClient.connect(), subClient.connect()]);
		console.log("[chat-service] Redis connected successfully");
	} catch (error) {
		console.error("[chat-service] Failed to connect to Redis:", error);
		throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : String(error)}`);
	}

	// Setup Socket.IO with Redis adapter
	const io = new SocketIOServer(httpServer, {
		path: "/socket/teamchat",
		cors: {
			origin:
				process.env.NODE_ENV === "production"
					? process.env.ALLOWED_ORIGINS?.split(",") || "*"
					: "*",
			methods: ["GET", "POST"],
			credentials: true,
		},
		adapter: createAdapter(pubClient, subClient),
		// Enable verbose logging in development
		transports: ["websocket", "polling"],
	});

	// Add connection logging
	io.engine.on("connection_error", (err) => {
		console.error("[chat-service] Socket.IO engine connection error:", {
			message: err.message,
			code: err.code,
			context: err.context,
		});
	});

	console.log("[chat-service] Socket.IO server initialized on path /socket/teamchat");

	// Attach Socket.IO to Fastify instance
	(fastify as FastifyWithSocket).io = io;
	(fastify as FastifyWithSocket).redis = pubClient;

	// Setup cache service
	const cacheService = getCacheService(fastify.log);
	setCacheService(cacheService);
	setRepositoryCache(cacheService);
	setTeamchatRepositoryCache(cacheService);
	(fastify as FastifyWithSocket).cache = cacheService;

	// Setup socket handlers
	setupSocketHandlers(io, pubClient);

	// Register routes
	await fastify.register(conversationsRoutes, { prefix: "/api/conversations" });
	await fastify.register(messagesRoutes, { prefix: "/api/conversations" });
	await fastify.register(channelsRoutes, { prefix: "/api/channels" });
	await fastify.register(channelMessagesRoutes, { prefix: "/api/messages" });
	await fastify.register(usersRoutes, { prefix: "/api/users" });

	// Bootstrap route (for teamchat initialization)
	const bootstrapRoutes = await import("./routes/bootstrap.js");
	await fastify.register(bootstrapRoutes.default, {
		prefix: "/api/teamchat/bootstrap",
	});

	// Direct messages route
	const directMessagesRoutes = await import("./routes/direct-messages.js");
	await fastify.register(directMessagesRoutes.default, {
		prefix: "/api/teamchat/direct-messages",
	});

	// Health check
	fastify.get("/health", async () => {
		return { status: "ok", service: "chat-service" };
	});

	// Attach Fastify to HTTP server
	try {
		await fastify.ready();
		console.log("[chat-service] Fastify is ready");
	} catch (error) {
		console.error("[chat-service] Fastify ready error:", error);
		throw error;
	}
	
	httpServer.on("request", (req, res) => {
		fastify.server.emit("request", req, res);
	});

	console.log("[chat-service] Server setup complete");
	return { httpServer, fastify, io, redis: pubClient };
}

async function start() {
	try {
		console.log(`[chat-service] Starting server on ${host}:${port}...`);
		console.log(`[chat-service] Redis URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`);
		console.log(`[chat-service] Database URL: ${process.env.DATABASE_URL ? "configured" : "not set"}`);
		
		const { httpServer } = await buildServer();
		
		console.log(`[chat-service] Server built successfully, starting HTTP server...`);

		httpServer.listen(port, host, () => {
			console.log(`[chat-service] Server listening on http://${host}:${port}`);
			console.log(`[chat-service] Socket.IO path: /socket/teamchat`);
		});
		
		httpServer.on("error", (error: Error) => {
			console.error("[chat-service] HTTP server error:", error);
			if ((error as any).code === "EADDRINUSE") {
				console.error(`[chat-service] Port ${port} is already in use`);
			}
			process.exit(1);
		});
	} catch (error) {
		console.error("[chat-service] Failed to start server:", error);
		if (error instanceof Error) {
			console.error("[chat-service] Error message:", error.message);
			console.error("[chat-service] Error stack:", error.stack);
		}
		process.exit(1);
	}
}

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("[chat-service] SIGTERM received, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", async () => {
	console.log("[chat-service] SIGINT received, shutting down gracefully...");
	process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
	void start();
}

export { buildServer };
