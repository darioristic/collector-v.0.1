import { NextRequest, NextResponse } from "next/server";

import { and, eq, ilike, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema/team-members";
import { vaultFolders } from "@/lib/db/schema/vault";

const payloadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Naziv je obavezan.")
      .max(255, "Naziv ne sme biti duži od 255 karaktera."),
    parentId: z.string().uuid().nullable().optional(),
    createdBy: z.string().uuid().nullable().optional()
  })
  .transform((data) => ({
    name: data.name,
    parentId: data.parentId ?? null,
    createdBy: data.createdBy ?? null
  }));

type PgError = Error & {
  code?: string;
};

const isUniqueViolation = (error: unknown): error is PgError =>
  Boolean(error) && typeof error === "object" && "code" in (error as PgError) && (error as PgError).code === "23505";

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

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

  const parsed = payloadSchema.safeParse(json);

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

  const { name, parentId, createdBy } = parsed.data;
  const normalizedName = name.trim();

  if (parentId) {
    const [parentFolder] = await db
      .select({ id: vaultFolders.id })
      .from(vaultFolders)
      .where(eq(vaultFolders.id, parentId))
      .limit(1);

    if (!parentFolder) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Nadređeni folder ne postoji."
          },
          { status: 404 }
        )
      );
    }
  }

  const nameConditions = [];

  if (parentId) {
    nameConditions.push(eq(vaultFolders.parentId, parentId));
  } else {
    nameConditions.push(isNull(vaultFolders.parentId));
  }

  nameConditions.push(ilike(vaultFolders.name, normalizedName));

  const [conflict] = await db
    .select({ id: vaultFolders.id })
    .from(vaultFolders)
    .where(nameConditions.length === 1 ? nameConditions[0] : and(...nameConditions))
    .limit(1);

  if (conflict) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Folder sa istim nazivom već postoji u izabranom direktorijumu."
        },
        { status: 409 }
      )
    );
  }

  if (createdBy) {
    const [member] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.id, createdBy))
      .limit(1);

    if (!member) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Prosleđeni korisnik ne postoji."
          },
          { status: 404 }
        )
      );
    }
  }

  const now = new Date();

  try {
    const [inserted] = await db
      .insert(vaultFolders)
      .values({
        name: normalizedName,
        parentId,
        createdBy,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    let owner = null;
    if (inserted.createdBy) {
      const [ownerRow] = await db
        .select({
          id: teamMembers.id,
          firstName: teamMembers.firstName,
          lastName: teamMembers.lastName,
          avatarUrl: teamMembers.avatarUrl
        })
        .from(teamMembers)
        .where(eq(teamMembers.id, inserted.createdBy))
        .limit(1);

      if (ownerRow) {
        owner = {
          id: ownerRow.id,
          name: [ownerRow.firstName, ownerRow.lastName].filter(Boolean).join(" ") || null,
          avatarUrl: ownerRow.avatarUrl ?? null
        };
      }
    }

    return withNoStore(
      NextResponse.json(
        {
          data: {
            id: inserted.id,
            name: inserted.name,
            parentId: inserted.parentId,
            createdAt: inserted.createdAt.toISOString(),
            updatedAt: inserted.updatedAt.toISOString(),
            owner
          }
        },
        { status: 201 }
      )
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Folder sa istim nazivom već postoji."
          },
          { status: 409 }
        )
      );
    }

    console.error("[vault][folders] Failed to create folder", error);
    return withNoStore(
      NextResponse.json(
        {
          error: "Kreiranje foldera nije uspelo."
        },
        { status: 500 }
      )
    );
  }
}


