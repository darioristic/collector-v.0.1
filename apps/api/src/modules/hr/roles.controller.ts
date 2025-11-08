import type { RouteHandler } from "fastify";

import type { Role } from "./hr.schema";
import { mockRoles } from "./hr.schema";

const roles: Role[] = [...mockRoles];

export type ListRolesReply = { data: Role[] };

export const listRoles: RouteHandler<{ Reply: ListRolesReply }> = async () => {
  // TODO: Sync role definitions with Accounts service permissions registry.
  return { data: roles };
};


