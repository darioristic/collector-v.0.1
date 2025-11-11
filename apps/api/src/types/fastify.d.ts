import type { AppDatabase } from "../db";

declare module "fastify" {
  interface FastifyInstance {
    db: AppDatabase;
  }

  interface FastifyRequest {
    db: AppDatabase;
  }
}

