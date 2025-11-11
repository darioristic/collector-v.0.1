import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema/team-members";
import {
  createTeamMemberSchema,
  listTeamMembersQuerySchema,
  listTeamMembersResponseSchema,
  type TeamMemberApi
} from "@/lib/validations/settings/team-members";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

type PgError = Error & {
  code?: string;
};

const isUniqueViolation = (error: unknown): error is PgError =>
  Boolean(error) && typeof error === "object" && "code" in (error as PgError) && (error as PgError).code === "23505";

const serializeTeamMember = (member: typeof teamMembers.$inferSelect): TeamMemberApi => ({
  id: member.id,
  firstName: member.firstName,
  lastName: member.lastName,
  email: member.email,
  role: member.role,
  status: member.status,
  avatarUrl: member.avatarUrl,
  createdAt: member.createdAt.toISOString(),
  updatedAt: member.updatedAt.toISOString()
});

export async function GET(request: NextRequest) {
  const db = await getDb();
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listTeamMembersQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidni parametri.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const { search, status } = parsed.data;
  const conditions = [];

  if (status) {
    conditions.push(eq(teamMembers.status, status));
  }

  if (search) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(teamMembers.firstName, pattern),
        ilike(teamMembers.lastName, pattern),
        ilike(teamMembers.email, pattern)
      )
    );
  }

  let statement = db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));

  if (conditions.length > 0) {
    statement = statement.where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  const rows = await statement;
  const payload = listTeamMembersResponseSchema.parse({
    data: rows.map(serializeTeamMember)
  });

  return withNoStore(NextResponse.json(payload));
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const json = await request.json().catch(() => null);

  if (!json || typeof json !== "object") {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidan payload."
        },
        { status: 400 }
      )
    );
  }

  const parsed = createTeamMemberSchema.safeParse(json);

  if (!parsed.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Nevalidni podaci.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const values = parsed.data;
  const now = new Date();

  try {
    const [member] = await db
      .insert(teamMembers)
      .values({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        status: values.status ?? "invited",
        avatarUrl: values.avatarUrl ?? null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return withNoStore(
      NextResponse.json(
        {
          data: serializeTeamMember(member)
        },
        { status: 201 }
      )
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Član tima sa ovom e-mail adresom već postoji."
          },
          { status: 409 }
        )
      );
    }

    console.error("[team-members] Failed to create", error);
    return withNoStore(
      NextResponse.json(
        {
          error: "Kreiranje člana tima nije uspelo."
        },
        { status: 500 }
      )
    );
  }
}

