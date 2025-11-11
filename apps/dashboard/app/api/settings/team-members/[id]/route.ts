import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema/team-members";
import {
  teamMemberApiSchema,
  type TeamMemberApi,
  updateTeamMemberSchema
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

const serializeTeamMember = (member: typeof teamMembers.$inferSelect): TeamMemberApi =>
  teamMemberApiSchema.parse({
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

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: Params) {
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

  const parsed = updateTeamMemberSchema.safeParse(json);

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
  const updates: Partial<typeof teamMembers.$inferInsert> = {};

  if (values.firstName !== undefined) {
    updates.firstName = values.firstName;
  }
  if (values.lastName !== undefined) {
    updates.lastName = values.lastName;
  }
  if (values.email !== undefined) {
    updates.email = values.email;
  }
  if (values.role !== undefined) {
    updates.role = values.role;
  }
  if (values.status !== undefined) {
    updates.status = values.status;
  }
  if (values.avatarUrl !== undefined) {
    updates.avatarUrl = values.avatarUrl ?? null;
  }

  updates.updatedAt = new Date();

  try {
    const [member] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, params.id))
      .returning();

    if (!member) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Član tima nije pronađen."
          },
          { status: 404 }
        )
      );
    }

    return withNoStore(
      NextResponse.json({
        data: serializeTeamMember(member)
      })
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

    console.error("[team-members] Failed to update", error);
    return withNoStore(
      NextResponse.json(
        {
          error: "Ažuriranje člana tima nije uspelo."
        },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const db = await getDb();

  try {
    const [deleted] = await db.delete(teamMembers).where(eq(teamMembers.id, params.id)).returning({ id: teamMembers.id });

    if (!deleted) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Član tima nije pronađen."
          },
          { status: 404 }
        )
      );
    }

    return withNoStore(new NextResponse(null, { status: 204 }));
  } catch (error) {
    console.error("[team-members] Failed to delete", error);
    return withNoStore(
      NextResponse.json(
        {
          error: "Brisanje člana tima nije uspelo."
        },
        { status: 500 }
      )
    );
  }
}

