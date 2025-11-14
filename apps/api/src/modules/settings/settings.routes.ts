import type { FastifyPluginAsync } from "fastify";

import {
  integrationListSchema,
  permissionListSchema,
  teamMemberCreateSchema,
  teamMemberDeleteSchema,
  teamMemberListSchema,
  teamMemberUpdateSchema,
  userCreateSchema,
  userListSchema
} from "./settings.schema";
import { listIntegrations } from "./integrations.controller";
import { listPermissions } from "./permissions.controller";
import { createUser, listUsers } from "./users.controller";
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  updateTeamMember
} from "./team-members.controller";

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/users", { schema: userListSchema }, listUsers);
  fastify.post("/users", { schema: userCreateSchema }, createUser);
  fastify.get("/permissions", { schema: permissionListSchema }, listPermissions);
  fastify.get("/integrations", { schema: integrationListSchema }, listIntegrations);
  fastify.get("/team-members", { schema: teamMemberListSchema }, listTeamMembers as any);
  fastify.post("/team-members", { schema: teamMemberCreateSchema }, createTeamMember as any);
  fastify.patch("/team-members/:id", { schema: teamMemberUpdateSchema }, updateTeamMember as any);
  fastify.delete("/team-members/:id", { schema: teamMemberDeleteSchema }, deleteTeamMember as any);
};

export default settingsRoutes;


