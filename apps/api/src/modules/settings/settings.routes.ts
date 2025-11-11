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
  fastify.get("/team-members", { schema: teamMemberListSchema }, listTeamMembers);
  fastify.post("/team-members", { schema: teamMemberCreateSchema }, createTeamMember);
  fastify.patch("/team-members/:id", { schema: teamMemberUpdateSchema }, updateTeamMember);
  fastify.delete("/team-members/:id", { schema: teamMemberDeleteSchema }, deleteTeamMember);
};

export default settingsRoutes;


