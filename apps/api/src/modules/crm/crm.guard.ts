import type { FastifyReply, FastifyRequest } from "fastify";

import { createHttpError } from "../../lib/errors";

import { CRM_ROLES, type CRMRole } from "@crm/types";

const roleSet = new Set<CRMRole>(CRM_ROLES);

const resolveRole = (roleHeader: string | string[] | undefined): string | undefined => {
  if (!roleHeader) {
    return undefined;
  }

  if (Array.isArray(roleHeader)) {
    return roleHeader[0];
  }

  return roleHeader;
};

const isCRMRole = (role: string | undefined): role is CRMRole => {
  return typeof role === "string" && roleSet.has(role as CRMRole);
};

export const createRoleGuard =
  (roles: CRMRole[]) => async (request: FastifyRequest, reply: FastifyReply) => {
    const role = resolveRole(request.headers["x-user-role"]);

    if (!role) {
      return reply
        .status(401)
        .send(createHttpError(401, "Missing x-user-role header", { error: "Unauthorized" }));
    }

    if (!isCRMRole(role)) {
      request.log.warn({ role }, "Unknown CRM role");

      return reply
        .status(403)
        .send(createHttpError(403, "Role not permitted for CRM access", { error: "Forbidden" }));
    }

    if (!roles.includes(role)) {
      request.log.warn({ role, allowed: roles }, "CRM role blocked by guard");

      return reply
        .status(403)
        .send(createHttpError(403, "Insufficient CRM permissions", { error: "Forbidden" }));
    }
  };


