import type { FastifyPluginAsync } from "fastify";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Collector Dashboard API",
        description: "RESTful API za Collector Dashboard platformu. Omogućava upravljanje prodajnim procesima, CRM funkcionalnostima, projektima, HR resursima i drugim poslovnim operacijama.",
        version: "1.0.0",
        contact: {
          name: "Collector Dashboard Team",
          email: "support@collector-dashboard.com"
        },
        license: {
          name: "Proprietary",
          url: "https://collector-dashboard.com/license"
        }
      },
      servers: [
        {
          url: "/",
          description: "Current environment"
        },
        {
          url: "http://localhost:4000",
          description: "Local development server"
        },
        {
          url: "https://api.collector-dashboard.com",
          description: "Production server"
        }
      ],
      tags: [
        {
          name: "accounts",
          description: "Upravljanje klijentskim nalozima i kontaktima"
        },
        {
          name: "auth",
          description: "Autentifikacija i autorizacija korisnika"
        },
        {
          name: "crm",
          description: "CRM operacije - leads, opportunities i aktivnosti"
        },
        {
          name: "sales-deals",
          description: "Upravljanje prodajnim poslovima (deals)"
        },
        {
          name: "sales-orders",
          description: "Upravljanje prodajnim porudžbinama"
        },
        {
          name: "sales-quotes",
          description: "Upravljanje ponudama (quotes)"
        },
        {
          name: "sales-invoices",
          description: "Upravljanje fakturama i naplatom"
        },
        {
          name: "sales-payments",
          description: "Upravljanje plaćanjima"
        },
        {
          name: "products",
          description: "Upravljanje proizvodima i inventarom"
        },
        {
          name: "projects",
          description: "Upravljanje projektima i portfoliom"
        },
        {
          name: "project-tasks",
          description: "Upravljanje zadacima unutar projekata"
        },
        {
          name: "project-milestones",
          description: "Praćenje projektnih milještoka"
        },
        {
          name: "hr-employees",
          description: "Upravljanje zaposlenima i HR zapisima"
        },
        {
          name: "hr-roles",
          description: "Definicije HR uloga"
        },
        {
          name: "hr-attendance",
          description: "Evidencija prisutnosti zaposlenih"
        },
        {
          name: "settings",
          description: "Podešavanja sistema, korisnika i integracija"
        },
        {
          name: "search",
          description: "Globalna pretraga kroz sve module"
        },
        {
          name: "notifications",
          description: "Upravljanje notifikacijama"
        },
        {
          name: "health",
          description: "Health check endpointi za monitoring"
        },
        {
          name: "metrics",
          description: "Metrije performansi i monitoring"
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

