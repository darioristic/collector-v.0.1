import type { FastifyReply, FastifyRequest } from "fastify";

import { mockPermissions } from "./settings.schema";

export const listPermissions = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({ data: mockPermissions });
};


