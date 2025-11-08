import type { FastifyPluginAsync } from "fastify";

import {
  integrationListSchema,
  permissionListSchema,
  userCreateSchema,
  userListSchema
} from "./settings.schema";
import { listIntegrations } from "./integrations.controller";
import { listPermissions } from "./permissions.controller";
import { createUser, listUsers } from "./users.controller";

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/users", { schema: userListSchema }, listUsers);
  fastify.post("/users", { schema: userCreateSchema }, createUser);
  fastify.get("/permissions", { schema: permissionListSchema }, listPermissions);
  fastify.get("/integrations", { schema: integrationListSchema }, listIntegrations);
};

export default settingsRoutes;


