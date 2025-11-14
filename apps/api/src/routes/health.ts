import type { FastifyPluginAsync } from "fastify";
import type { User } from "@crm/types";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../db/index.js";
import type { CacheService } from "../lib/cache.service.js";

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
    error?: string;
  };
  redis?: {
    status: "ok" | "down";
    responseTime?: number;
    error?: string;
  };
  dependencies?: {
    database: "ok" | "down";
    redis: "ok" | "down";
  };
  details?: {
    database?: string;
    redis?: string;
  };
}

const checkDatabase = async (
  db: AppDatabase
): Promise<{ status: "ok" | "down"; responseTime?: number; error?: string }> => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString === "pg-mem") {
    return { status: "ok" }; // In-memory database is always available
  }

  try {
    const startTime = Date.now();
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 5000)
      )
    ]);
    const responseTime = Date.now() - startTime;

    return { status: "ok", responseTime };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { status: "down", error: errorMessage };
  }
};

const checkRedis = async (
  cache: CacheService | undefined
): Promise<{ status: "ok" | "down"; responseTime?: number; error?: string }> => {
  if (!cache || typeof cache.checkHealth !== "function") {
    return { status: "down", error: "Cache service not available" };
  }

  return await cache.checkHealth();
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
                  responseTime: { type: "number" },
                  error: { type: "string" }
                }
              },
              redis: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ok", "down"] },
                  responseTime: { type: "number" },
                  error: { type: "string" }
                }
              },
              dependencies: {
                type: "object",
                properties: {
                  database: { type: "string", enum: ["ok", "down"] },
                  redis: { type: "string", enum: ["ok", "down"] }
                }
              },
              details: {
                type: "object",
                properties: {
                  database: { type: "string" },
                  redis: { type: "string" }
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
      const [dbHealth, redisHealth] = await Promise.all([
        checkDatabase(app.db),
        checkRedis(app.cache)
      ]);

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
        dependencies,
        details: {
          database: dbHealth.error,
          redis: redisHealth.error
        }
      };

      if (overallStatus === "down") {
        return reply.status(503).send(healthStatus);
      }

      return reply.status(200).send(healthStatus);
    }
  );

  app.get(
    "/health/database",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Database connection status",
        description: "Check database connection health status",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "down"] },
              responseTime: { type: "number" },
              timestamp: { type: "string" }
            },
            required: ["status", "timestamp"]
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["down"] },
              error: { type: "string" },
              timestamp: { type: "string" }
            },
            required: ["status", "timestamp"]
          }
        }
      }
    },
    async (request, reply) => {
      const dbHealth = await checkDatabase(app.db);

      const response = {
        status: dbHealth.status,
        timestamp: new Date().toISOString(),
        ...(dbHealth.responseTime && { responseTime: dbHealth.responseTime }),
        ...(dbHealth.error && { error: dbHealth.error })
      };

      if (dbHealth.status === "down") {
        return reply.status(503).send(response);
      }

      return reply.status(200).send(response);
    }
  );

  app.get(
    "/health/redis",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Redis connection status",
        description: "Check Redis connection health status",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "down"] },
              responseTime: { type: "number" },
              timestamp: { type: "string" }
            },
            required: ["status", "timestamp"]
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["down"] },
              error: { type: "string" },
              timestamp: { type: "string" }
            },
            required: ["status", "timestamp"]
          }
        }
      }
    },
    async (request, reply) => {
      const redisHealth = await checkRedis(app.cache);

      const response = {
        status: redisHealth.status,
        timestamp: new Date().toISOString(),
        ...(redisHealth.responseTime && { responseTime: redisHealth.responseTime }),
        ...(redisHealth.error && { error: redisHealth.error })
      };

      if (redisHealth.status === "down") {
        return reply.status(503).send(response);
      }

      return reply.status(200).send(response);
    }
  );

  app.get(
    "/health/dependencies",
    {
      schema: {
        tags: ["health", "monitoring"],
        summary: "Service dependencies status",
        description: "Check status of all service dependencies (database, redis, etc.)",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "degraded", "down"] },
              timestamp: { type: "string" },
              dependencies: {
                type: "object",
                properties: {
                  database: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["ok", "down"] },
                      responseTime: { type: "number" },
                      error: { type: "string" }
                    }
                  },
                  redis: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["ok", "down"] },
                      responseTime: { type: "number" },
                      error: { type: "string" }
                    }
                  }
                }
              }
            },
            required: ["status", "timestamp", "dependencies"]
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["down"] },
              timestamp: { type: "string" },
              dependencies: {
                type: "object"
              }
            },
            required: ["status", "timestamp"]
          }
        }
      }
    },
    async (request, reply) => {
      const [dbHealth, redisHealth] = await Promise.all([
        checkDatabase(app.db),
        checkRedis(app.cache)
      ]);

      const dependencies = {
        database: {
          status: dbHealth.status,
          ...(dbHealth.responseTime && { responseTime: dbHealth.responseTime }),
          ...(dbHealth.error && { error: dbHealth.error })
        },
        redis: {
          status: redisHealth.status,
          ...(redisHealth.responseTime && { responseTime: redisHealth.responseTime }),
          ...(redisHealth.error && { error: redisHealth.error })
        }
      };

      let overallStatus: "ok" | "degraded" | "down" = "ok";
      if (dbHealth.status === "down") {
        overallStatus = "down";
      } else if (redisHealth.status === "down") {
        overallStatus = "degraded"; // Redis is optional, so degraded not down
      }

      const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        dependencies
      };

      if (overallStatus === "down") {
        return reply.status(503).send(response);
      }

      return reply.status(200).send(response);
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
      const dbHealth = await checkDatabase(app.db);

      if (dbHealth.status === "down") {
        return reply.status(503).send({
          status: "not ready",
          ready: false,
          reason: "Database unavailable",
          error: dbHealth.error
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

