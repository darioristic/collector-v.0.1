import { createServer } from "node:http";
import Fastify from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, type RedisClientType } from "redis";
import corsPlugin from "@fastify/cors";
import * as dotenv from "dotenv";
import notificationsRoutes from "./routes/notifications.js";
import { setupSocketHandlers } from "./socket/handler.js";
import { setupEventListener } from "./lib/event-listener.js";
import { getCacheService } from "./lib/cache.service.js";
import { setCacheService } from "./lib/repository.js";

dotenv.config();

const port = Number(process.env.PORT || 4002);
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
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Session-Token"],
  });

  // Create HTTP server
  const httpServer = createServer();

  // Setup Redis
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const pubClient = createClient({ url: redisUrl }) as RedisClientType;
  const subClient = pubClient.duplicate() as RedisClientType;

  await Promise.all([pubClient.connect(), subClient.connect()]);

  // Setup Socket.IO with Redis adapter
  const io = new SocketIOServer(httpServer, {
    path: "/socket/notifications",
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGINS?.split(",") || "*"
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  });

  // Attach Socket.IO to Fastify instance
  (fastify as any).io = io;
  (fastify as any).redis = pubClient;

  // Setup cache service
  const cacheService = getCacheService(fastify.log);
  setCacheService(cacheService);
  (fastify as any).cache = cacheService;

  // Setup socket handlers
  setupSocketHandlers(io, pubClient);

  // Setup Redis event listener
  setupEventListener(subClient, io, cacheService);

  // Register routes
  await fastify.register(notificationsRoutes, { prefix: "/api/notifications" });

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", service: "notification-service" };
  });

  // Attach Fastify to HTTP server
  await fastify.ready();
  httpServer.on("request", (req, res) => {
    fastify.server.emit("request", req, res);
  });

  return { httpServer, fastify, io, redis: pubClient };
}

async function start() {
  try {
    const { httpServer } = await buildServer();

    httpServer.listen(port, host, () => {
      console.log(`[notification-service] Server listening on http://${host}:${port}`);
      console.log(`[notification-service] Socket.IO path: /socket/notifications`);
    });
  } catch (error) {
    console.error("[notification-service] Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[notification-service] SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[notification-service] SIGINT received, shutting down gracefully...");
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  void start();
}

export { buildServer };

