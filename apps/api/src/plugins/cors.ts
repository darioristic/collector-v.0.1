import type { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://192.168.0.3:3000"
]);

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, origin);
        return;
      }

      callback(new Error(`Origin ${origin} nije dozvoljen prema CORS pravilima.`), false);
    }
  });
};

export default corsPlugin;