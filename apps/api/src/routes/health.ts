import type { FastifyPluginAsync } from "fastify";
import type { User } from "@crm/types";
import { Pool } from "pg";
import Redis from "ioredis";

const systemUser: User = {
  id: "system",
  email: "system@crm.local",
  name: "System"
};

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  database?: {
    status: "ok" | "down";
    responseTime?: number;
  };
  redis?: {
    status: "ok" | "down";
    responseTime?: number;
  };
  dependencies?: {
    database: "ok" | "down";
    redis: "ok" | "down";
  };
}

const checkDatabase = async (): Promise<{ status: "ok" | "down"; responseTime?: number }> => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString === "pg-mem") {
    return { status: "ok" }; // In-memory database is always available
  }

  try {
    const startTime = Date.now();
    const pool = new Pool({ connectionString, max: 1 });
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    const responseTime = Date.now() - startTime;

    return { status: "ok", responseTime };
  } catch (error) {
    return { status: "down" };
  }
};

const checkRedis = async (): Promise<{ status: "ok" | "down"; responseTime?: number }> => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    const startTime = Date.now();
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true
    });

    await redis.connect();
    await redis.ping();
    const responseTime = Date.now() - startTime;
    await redis.quit();

    return { status: "ok", responseTime };
  } catch (error) {
    return { status: "down" };
  }
};

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: { status: "ok" } }>(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Service health status",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok"] }
            },
            required: ["status"]
          }
        }
      }
    },
    async () => {
      app.log.debug({ checkedBy: systemUser.id }, "Health check requested");

      return { status: "ok" } as const;
    }
  );

  app.get(
    "/health/detailed",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Detailed health check",
        description: "Detailed health check with database and Redis status",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "degraded", "down"] },
              service: { type: "string" },
              timestamp: { type: "string" },
              database: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ok", "down"] },
                  responseTime: { type: "number" }
                }
              },
              redis: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ok", "down"] },
                  responseTime: { type: "number" }
                }
              },
              dependencies: {
                type: "object",
                properties: {
                  database: { type: "string", enum: ["ok", "down"] },
                  redis: { type: "string", enum: ["ok", "down"] }
                }
              }
            }
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              service: { type: "string" },
              timestamp: { type: "string" }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const [dbHealth, redisHealth] = await Promise.all([checkDatabase(), checkRedis()]);

      const dependencies = {
        database: dbHealth.status,
        redis: redisHealth.status
      };

      let overallStatus: "ok" | "degraded" | "down" = "ok";
      if (dbHealth.status === "down") {
        overallStatus = "down";
      } else if (redisHealth.status === "down") {
        overallStatus = "degraded"; // Redis is optional, so degraded not down
      }

      const healthStatus: HealthStatus = {
        status: overallStatus,
        service: "collector-api",
        timestamp: new Date().toISOString(),
        database: dbHealth,
        redis: redisHealth,
        dependencies
      };

      if (overallStatus === "down") {
        return reply.status(503).send(healthStatus);
      }

      return reply.status(200).send(healthStatus);
    }
  );

  app.get(
    "/health/ready",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Readiness check",
        description: "Readiness probe - checks if service is ready to accept traffic",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              ready: { type: "boolean" }
            }
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              ready: { type: "boolean" }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const dbHealth = await checkDatabase();

      if (dbHealth.status === "down") {
        return reply.status(503).send({
          status: "not ready",
          ready: false,
          reason: "Database unavailable"
        });
      }

      return reply.status(200).send({
        status: "ready",
        ready: true
      });
    }
  );

  app.get(
    "/health/live",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Liveness check",
        description: "Liveness probe - checks if service is alive",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              alive: { type: "boolean" }
            }
          }
        }
      }
    },
    async () => {
      return {
        status: "alive",
        alive: true
      };
    }
  );
};

export default healthRoutes;

