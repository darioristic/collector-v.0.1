import type { FastifyPluginAsync } from "fastify";
import type { User } from "@crm/types";

const systemUser: User = {
  id: "system",
  email: "system@crm.local",
  name: "System"
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
};

export default healthRoutes;

