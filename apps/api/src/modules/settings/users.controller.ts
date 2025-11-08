import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import {
  type CreateUserInput,
  type SettingsUser,
  mockUsers
} from "./settings.schema";

export const listUsers = async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({ data: mockUsers });
};

export const createUser = async (
  request: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) => {
  const payload = request.body;

  const user: SettingsUser = {
    id: `user_${randomUUID()}`,
    username: payload.username,
    email: payload.email,
    role: payload.role,
    active: payload.active ?? true
  };

  mockUsers.push(user);

  return reply.status(201).send({ data: user });
};


