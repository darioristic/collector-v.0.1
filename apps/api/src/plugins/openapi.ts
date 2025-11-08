import type { FastifyPluginAsync } from "fastify";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Collector Dashboard API",
        description: "API surface for Collector Dashboard services.",
        version: "1.0.0"
      },
      servers: [
        {
          url: "/",
          description: "Current environment"
        }
      ],
      tags: [
        {
          name: "accounts",
          description: "Customer account management"
        },
        {
          name: "health",
          description: "Service health endpoints"
        }
      ]
    }
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true
    },
    staticCSP: true
  });
};

export default openApiPlugin;

