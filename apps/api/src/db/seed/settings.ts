import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { teamMembers } from "../schema/settings.schema";

type SeedTeamMember = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "online" | "offline" | "idle" | "invited";
  createdAt: string;
};

const TEAM_MEMBERS: SeedTeamMember[] = [
  {
    firstName: "Jessica",
    lastName: "Wong",
    email: "jessica@example.com",
    role: "Admin",
    status: "online",
    createdAt: "2026-01-24T09:00:00.000Z"
  },
  {
    firstName: "Jason",
    lastName: "Gabriel",
    email: "jason@example.com",
    role: "Designer",
    status: "offline",
    createdAt: "2026-01-26T09:00:00.000Z"
  },
  {
    firstName: "Mona",
    lastName: "Smith",
    email: "mona@example.com",
    role: "Researcher",
    status: "idle",
    createdAt: "2026-01-27T09:00:00.000Z"
  },
  {
    firstName: "Julian",
    lastName: "Nguyen",
    email: "julian@example.com",
    role: "Marketing",
    status: "online",
    createdAt: "2025-12-12T09:00:00.000Z"
  },
  {
    firstName: "Tessa",
    lastName: "Yorker",
    email: "tessa@example.com",
    role: "Designer",
    status: "offline",
    createdAt: "2025-11-17T09:00:00.000Z"
  },
  {
    firstName: "Lana",
    lastName: "Kate",
    email: "kate@example.com",
    role: "Manager",
    status: "online",
    createdAt: "2025-10-03T09:00:00.000Z"
  },
  {
    firstName: "Han",
    lastName: "Ming",
    email: "han@example.com",
    role: "Developer",
    status: "offline",
    createdAt: "2026-01-22T09:00:00.000Z"
  },
  {
    firstName: "Casey",
    lastName: "Westlister",
    email: "casey@example.com",
    role: "Marketing",
    status: "idle",
    createdAt: "2025-10-01T09:00:00.000Z"
  }
];

const ensureTeamMembersSchema = async (db = defaultDb) => {
  await db.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_status') THEN
      CREATE TYPE team_member_status AS ENUM ('online', 'offline', 'idle', 'invited');
    END IF;
  END $$;`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "team_members" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "first_name" text NOT NULL,
      "last_name" text NOT NULL,
      "email" text NOT NULL,
      "role" text NOT NULL,
      "status" team_member_status NOT NULL DEFAULT 'offline',
      "avatar_url" text,
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ADD COLUMN IF NOT EXISTS "avatar_url" text;
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ADD COLUMN IF NOT EXISTS "status" team_member_status NOT NULL DEFAULT 'offline';
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ALTER COLUMN "status" SET DEFAULT 'offline';
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT NOW();
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ALTER COLUMN "created_at" SET DEFAULT NOW();
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT NOW();
  `);

  await db.execute(sql`
    ALTER TABLE "team_members"
      ALTER COLUMN "updated_at" SET DEFAULT NOW();
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "team_members_email_key"
      ON "team_members" ("email");
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "team_members_status_idx"
      ON "team_members" ("status");
  `);
};

export const seedSettings = async (database = defaultDb) => {
  await ensureTeamMembersSchema(database);

  await database.transaction(async (tx) => {
    await Promise.all(
      TEAM_MEMBERS.map((member) =>
        tx
          .insert(teamMembers)
          .values({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            role: member.role,
            status: member.status,
            createdAt: new Date(member.createdAt),
            updatedAt: sql`NOW()`
          })
          .onConflictDoUpdate({
            target: teamMembers.email,
            set: {
              firstName: member.firstName,
              lastName: member.lastName,
              role: member.role,
              status: member.status,
              updatedAt: sql`NOW()`
            }
          })
      )
    );
  });
};

