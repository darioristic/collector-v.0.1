-- Settings tables: permissions, integrations, team_members

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "permissions_resource_action_idx" ON "permissions" ("resource", "action");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
    CREATE TYPE "integration_provider" AS ENUM ('hubspot','salesforce','slack','google');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
    CREATE TYPE "integration_status" AS ENUM ('connected','disconnected','error');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" "integration_provider" NOT NULL,
  "status" "integration_status" NOT NULL DEFAULT 'disconnected',
  "external_id" text,
  "settings" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "integrations_provider_status_idx" ON "integrations" ("provider","status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_status') THEN
      CREATE TYPE "team_member_status" AS ENUM ('online','offline','idle','invited');
    END IF;

    CREATE TABLE "team_members" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "first_name" text NOT NULL,
      "last_name" text NOT NULL,
      "email" text NOT NULL,
      "role" text NOT NULL,
      "status" "team_member_status" NOT NULL DEFAULT 'offline',
      "avatar_url" text,
      "company_id" uuid REFERENCES "companies"("id") ON DELETE CASCADE,
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "team_members_company_email_key" ON "team_members" ("company_id","email");
    CREATE INDEX IF NOT EXISTS "team_members_status_idx" ON "team_members" ("status");
    CREATE INDEX IF NOT EXISTS "team_members_company_idx" ON "team_members" ("company_id");
  END IF;
END $$;