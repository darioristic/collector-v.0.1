import type { FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { teamMembers, users } from "../../db/schema/settings.schema.js";
import { createHttpError } from "../../lib/errors";
import type { AuthenticatedRequest } from "../../types/auth";
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

const serializeTeamMember = (
  member: typeof teamMembers.$inferSelect,
  userId: string | null = null
): SettingsTeamMember => ({
  id: member.id,
  firstName: member.firstName,
  lastName: member.lastName,
  email: member.email,
  role: member.role,
  status: member.status as TeamMemberStatus,
  avatarUrl: member.avatarUrl,
  userId: userId ?? null,
  createdAt: member.createdAt.toISOString(),
  updatedAt: member.updatedAt.toISOString(),
});

export const listTeamMembers = async (
  request: FastifyRequest<{ Querystring: ListTeamMembersQuery }> & AuthenticatedRequest,
  reply: FastifyReply
) => {
  const { search, status } = request.query;
  const companyId = request.user.companyId;
  const filters = [eq(teamMembers.companyId, companyId)];

  if (status) {
    filters.push(eq(teamMembers.status, status));
  }

  if (search) {
    const pattern = `%${search.trim()}%`;
    const searchFilter = or(
      ilike(teamMembers.firstName, pattern),
      ilike(teamMembers.lastName, pattern),
      ilike(teamMembers.email, pattern)
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  try {
    const rows = await request.db
      .select()
      .from(teamMembers)
      .where(filters.length > 0 ? (filters.length === 1 ? filters[0] : and(...filters)) : undefined)
      .orderBy(desc(teamMembers.createdAt));

    const emails = rows.map((row) => row.email);
    const userMap = new Map<string, string>();

    if (emails.length > 0) {
      try {
        const userRows = await request.db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(inArray(users.email, emails));

        userRows.forEach((user) => {
          userMap.set(user.email, user.id);
        });
      } catch (userError) {
        request.log.warn({ err: userError }, "Failed to fetch users for team members");
      }
    }

    const data = rows.map((member) =>
      serializeTeamMember(member, userMap.get(member.email) || null)
    );

    return reply.status(200).send({ data });
  } catch (error) {
    request.log.error({ err: error, search, status }, "Failed to list team members");
    return reply
      .status(500)
      .send(createHttpError(500, "Unable to list team members", { error: "Unable to list team members" }));
  }
};

export const createTeamMember = async (
  request: FastifyRequest<{ Body: CreateTeamMemberInput }> & AuthenticatedRequest,
  reply: FastifyReply
) => {
  const now = new Date();
  const payload = request.body;
  const companyId = request.user.companyId;

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
        companyId,
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
  request: FastifyRequest<{ Params: TeamMemberParams; Body: UpdateTeamMemberInput }> & AuthenticatedRequest,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const payload = request.body;
  const companyId = request.user.companyId;

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
      .where(and(eq(teamMembers.id, id), eq(teamMembers.companyId, companyId)))
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
  request: FastifyRequest<{ Params: TeamMemberParams }> & AuthenticatedRequest,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const companyId = request.user.companyId;

  try {
    const deleted = await request.db
      .delete(teamMembers)
      .where(and(eq(teamMembers.id, id), eq(teamMembers.companyId, companyId)))
      .returning();

    if (deleted.length === 0) {
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

