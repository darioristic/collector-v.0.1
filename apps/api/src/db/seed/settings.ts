import { eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { companies } from "../schema/auth.schema";
import { teamMembers, users } from "../schema/settings.schema";

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
    // Get the company ID (Collector Labs)
    const [company] = await tx
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "collector-labs"))
      .limit(1);

    if (!company) {
      throw new Error("Company 'collector-labs' not found. Please run auth seed first.");
    }

    const companyId = company.id;

    // Update existing team members without companyId to have companyId
    await tx
      .update(teamMembers)
      .set({ companyId: companyId })
      .where(isNull(teamMembers.companyId));

    // Get users from auth seed to create team members for them
    const authUsers = await tx
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.defaultCompanyId, companyId));

    // Create team members for auth users
    const authTeamMembers = authUsers.map((user) => {
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Map role from user roles
      let role = "User";
      if (user.email === "dario@collectorlabs.test") {
        role = "Admin";
      } else if (user.email === "miha@collectorlabs.test") {
        role = "Manager";
      }

      return {
        firstName,
        lastName,
        email: user.email,
        role,
        status: "online" as const,
        createdAt: new Date(),
      };
    });

    // Combine auth users and example team members
    const allTeamMembers = [...authTeamMembers, ...TEAM_MEMBERS.map((member) => ({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      status: member.status,
      createdAt: new Date(member.createdAt),
    }))];

    await Promise.all(
      allTeamMembers.map((member) =>
        tx
          .insert(teamMembers)
          .values({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            role: member.role,
            status: member.status,
            companyId: companyId,
            createdAt: member.createdAt,
            updatedAt: sql`NOW()`
          })
          .onConflictDoUpdate({
            target: [teamMembers.companyId, teamMembers.email],
            set: {
              firstName: member.firstName,
              lastName: member.lastName,
              role: member.role,
              status: member.status,
              companyId: companyId,
              updatedAt: sql`NOW()`
            }
          })
      )
    );
  });
};

