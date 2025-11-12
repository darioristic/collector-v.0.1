import type { FastifyRequest } from "fastify";

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

