import type { FastifyReply, FastifyRequest } from "fastify";

import { mockIntegrations } from "./settings.schema";

export const listIntegrations = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({ data: mockIntegrations });
};


