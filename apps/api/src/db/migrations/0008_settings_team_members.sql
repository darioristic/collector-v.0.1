DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_status') THEN
    CREATE TYPE "team_member_status" AS ENUM ('online', 'offline', 'idle', 'invited');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "status" "team_member_status" NOT NULL DEFAULT 'offline',
  "avatar_url" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_email_key" ON "team_members" ("email");
CREATE INDEX IF NOT EXISTS "team_members_status_idx" ON "team_members" ("status");

