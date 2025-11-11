import type { FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import { teamMembers } from "../../db/schema/settings.schema";
import { createHttpError } from "../../lib/errors";
import {
  type CreateTeamMemberInput,
  type ListTeamMembersQuery,
  type SettingsTeamMember,
  type TeamMemberStatus,
  type UpdateTeamMemberInput
} from "./settings.schema";

type TeamMemberParams = {
  id: string;
};

type PgError = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
};

const isUniqueViolation = (error: unknown): error is PgError =>
  Boolean(error) && typeof error === "object" && "code" in (error as PgError) && (error as PgError).code === "23505";

const serializeTeamMember = (member: typeof teamMembers.$inferSelect): SettingsTeamMember => ({
  id: member.id,
  firstName: member.firstName,
  lastName: member.lastName,
  email: member.email,
  role: member.role,
  status: member.status as TeamMemberStatus,
  avatarUrl: member.avatarUrl,
  createdAt: member.createdAt.toISOString(),
  updatedAt: member.updatedAt.toISOString()
});

export const listTeamMembers = async (
  request: FastifyRequest<{ Querystring: ListTeamMembersQuery }>,
  reply: FastifyReply
) => {
  const { search, status } = request.query;
  const filters = [];

  if (status) {
    filters.push(eq(teamMembers.status, status));
  }

  if (search) {
    const pattern = `%${search.trim()}%`;
    filters.push(
      or(
        ilike(teamMembers.firstName, pattern),
        ilike(teamMembers.lastName, pattern),
        ilike(teamMembers.email, pattern)
      )
    );
  }

  let statement = request.db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));

  if (filters.length > 0) {
    statement = statement.where(filters.length === 1 ? filters[0] : and(...filters));
  }

  const rows = await statement;
  const data = rows.map(serializeTeamMember);

  return reply.status(200).send({ data });
};

export const createTeamMember = async (
  request: FastifyRequest<{ Body: CreateTeamMemberInput }>,
  reply: FastifyReply
) => {
  const now = new Date();
  const payload = request.body;

  try {
    const [member] = await request.db
      .insert(teamMembers)
      .values({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        role: payload.role,
        status: payload.status ?? "invited",
        avatarUrl: payload.avatarUrl ?? null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return reply.status(201).send({ data: serializeTeamMember(member) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send(createHttpError(409, "A team member with this email already exists.", { error: "Conflict" }));
    }

    request.log.error({ err: error, email: payload.email }, "Failed to create team member");
    return reply
      .status(500)
      .send(createHttpError(500, "Unable to create team member", { error: "Unable to create team member" }));
  }
};

export const updateTeamMember = async (
  request: FastifyRequest<{ Params: TeamMemberParams; Body: UpdateTeamMemberInput }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const payload = request.body;

  const updates: Partial<typeof teamMembers.$inferInsert> = {};

  if (payload.firstName !== undefined) {
    updates.firstName = payload.firstName;
  }
  if (payload.lastName !== undefined) {
    updates.lastName = payload.lastName;
  }
  if (payload.email !== undefined) {
    updates.email = payload.email;
  }
  if (payload.role !== undefined) {
    updates.role = payload.role;
  }
  if (payload.status !== undefined) {
    updates.status = payload.status;
  }
  if (payload.avatarUrl !== undefined) {
    updates.avatarUrl = payload.avatarUrl ?? null;
  }

  try {
    const [member] = await request.db
      .update(teamMembers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(teamMembers.id, id))
      .returning();

    if (!member) {
      return reply
        .status(404)
        .send(createHttpError(404, `Team member ${id} not found`, { error: "Team member not found." }));
    }

    return reply.status(200).send({ data: serializeTeamMember(member) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send(createHttpError(409, "A team member with this email already exists.", { error: "Conflict" }));
    }

    request.log.error({ err: error, id }, "Failed to update team member");
    return reply
      .status(500)
      .send(createHttpError(500, "Unable to update team member", { error: "Unable to update team member." }));
  }
};

export const deleteTeamMember = async (
  request: FastifyRequest<{ Params: TeamMemberParams }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  try {
    const [deleted] = await request.db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning({ id: teamMembers.id });

    if (!deleted) {
      return reply
        .status(404)
        .send(createHttpError(404, `Team member ${id} not found`, { error: "Team member not found." }));
    }

    return reply.status(204).send();
  } catch (error) {
    request.log.error({ err: error, id }, "Failed to delete team member");
    return reply
      .status(500)
      .send(createHttpError(500, "Unable to delete team member", { error: "Unable to delete team member." }));
  }
};

