import { eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { companies } from "../schema/auth.schema";
import { integrations, permissions, roles, teamMembers, users } from "../schema/settings.schema";

type SeedTeamMember = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "online" | "offline" | "idle" | "invited";
  createdAt: string;
};

const TEAM_MEMBERS: SeedTeamMember[] = [
  { firstName: "Marko", lastName: "Janković", email: "marko.jankovic@example.com", role: "Sales", status: "online", createdAt: "2025-11-14T09:00:00.000Z" },
  { firstName: "Jovana", lastName: "Petrović", email: "jovana.petrovic@example.com", role: "Designer", status: "offline", createdAt: "2025-11-12T09:00:00.000Z" },
  { firstName: "Nikola", lastName: "Ilić", email: "nikola.ilic@example.com", role: "Developer", status: "idle", createdAt: "2025-11-10T09:00:00.000Z" },
  { firstName: "Mina", lastName: "Simić", email: "mina.simic@example.com", role: "Marketing", status: "online", createdAt: "2025-11-08T09:00:00.000Z" },
  { firstName: "Luka", lastName: "Radulović", email: "luka.radulovic@example.com", role: "Product", status: "offline", createdAt: "2025-11-06T09:00:00.000Z" },
  { firstName: "Sara", lastName: "Kovačević", email: "sara.kovacevic@example.com", role: "Manager", status: "online", createdAt: "2025-11-04T09:00:00.000Z" },
  { firstName: "Aleksa", lastName: "Milić", email: "aleksa.milic@example.com", role: "Researcher", status: "offline", createdAt: "2025-11-02T09:00:00.000Z" },
  { firstName: "Tijana", lastName: "Đorđević", email: "tijana.djordjevic@example.com", role: "Support", status: "idle", createdAt: "2025-11-01T09:00:00.000Z" }
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

    // Create permissions for roles
    const existingRoles = await tx
      .select({ id: roles.id, key: roles.key })
      .from(roles);

    type RoleKey = "admin" | "manager" | "user" | "sales_manager" | "sales_rep" | "support" | "viewer";
    const roleMap = new Map<RoleKey, string>(existingRoles.map((r) => [r.key as RoleKey, r.id]));

    const permissionsData: Array<{ roleKey: RoleKey; resource: string; action: string }> = [
      // Admin permissions - full access
      { roleKey: "admin", resource: "accounts", action: "create" },
      { roleKey: "admin", resource: "accounts", action: "read" },
      { roleKey: "admin", resource: "accounts", action: "update" },
      { roleKey: "admin", resource: "accounts", action: "delete" },
      { roleKey: "admin", resource: "users", action: "create" },
      { roleKey: "admin", resource: "users", action: "read" },
      { roleKey: "admin", resource: "users", action: "update" },
      { roleKey: "admin", resource: "users", action: "delete" },
      { roleKey: "admin", resource: "projects", action: "create" },
      { roleKey: "admin", resource: "projects", action: "read" },
      { roleKey: "admin", resource: "projects", action: "update" },
      { roleKey: "admin", resource: "projects", action: "delete" },
      { roleKey: "admin", resource: "sales", action: "create" },
      { roleKey: "admin", resource: "sales", action: "read" },
      { roleKey: "admin", resource: "sales", action: "update" },
      { roleKey: "admin", resource: "sales", action: "delete" },
      { roleKey: "admin", resource: "settings", action: "read" },
      { roleKey: "admin", resource: "settings", action: "update" },
      
      // Manager permissions - most access except user management
      { roleKey: "manager", resource: "accounts", action: "create" },
      { roleKey: "manager", resource: "accounts", action: "read" },
      { roleKey: "manager", resource: "accounts", action: "update" },
      { roleKey: "manager", resource: "projects", action: "create" },
      { roleKey: "manager", resource: "projects", action: "read" },
      { roleKey: "manager", resource: "projects", action: "update" },
      { roleKey: "manager", resource: "sales", action: "create" },
      { roleKey: "manager", resource: "sales", action: "read" },
      { roleKey: "manager", resource: "sales", action: "update" },
      { roleKey: "manager", resource: "settings", action: "read" },
      
      // User permissions - read and limited create
      { roleKey: "user", resource: "accounts", action: "read" },
      { roleKey: "user", resource: "projects", action: "read" },
      { roleKey: "user", resource: "projects", action: "create" },
      { roleKey: "user", resource: "sales", action: "read" },
      { roleKey: "user", resource: "settings", action: "read" },
    ];

    if (permissionsData.length > 0) {
      await Promise.all(
        permissionsData.map((perm) => {
          const roleId = roleMap.get(perm.roleKey);
          if (!roleId) return Promise.resolve();

          return tx
            .insert(permissions)
            .values({
              roleId,
              resource: perm.resource,
              action: perm.action
            })
            .onConflictDoNothing();
        })
      );
    }

    // Create integrations
    const integrationsData = [
      {
        provider: "hubspot" as const,
        status: "connected" as const,
        externalId: "hubspot-12345",
        settings: JSON.stringify({ apiKey: "demo-key", syncEnabled: true })
      },
      {
        provider: "salesforce" as const,
        status: "disconnected" as const,
        externalId: null,
        settings: null
      },
      {
        provider: "slack" as const,
        status: "connected" as const,
        externalId: "slack-workspace-abc",
        settings: JSON.stringify({ webhookUrl: "https://hooks.slack.com/...", channel: "#notifications" })
      },
      {
        provider: "google" as const,
        status: "connected" as const,
        externalId: "google-oauth-xyz",
        settings: JSON.stringify({ calendarSync: true, driveSync: false })
      }
    ];

    if (integrationsData.length > 0) {
      // Check existing integrations by provider
      const existingIntegrations = await tx
        .select({ id: integrations.id, provider: integrations.provider })
        .from(integrations);

      const existingProviders = new Set(existingIntegrations.map((i) => i.provider));

      for (const integration of integrationsData) {
        if (existingProviders.has(integration.provider)) {
          // Update existing integration
          const existing = existingIntegrations.find((i) => i.provider === integration.provider);
          if (existing) {
            await tx
              .update(integrations)
              .set({
                status: integration.status,
                externalId: integration.externalId,
                settings: integration.settings,
                updatedAt: sql`NOW()`
              })
              .where(eq(integrations.id, existing.id));
          }
        } else {
          // Insert new integration
          await tx.insert(integrations).values(integration);
        }
      }
    }
  });
};

