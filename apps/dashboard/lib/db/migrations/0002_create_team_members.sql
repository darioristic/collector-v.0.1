CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "team_member_status" AS ENUM ('online', 'offline', 'idle', 'invited');

CREATE TABLE "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "role" varchar(100) NOT NULL,
  "status" "team_member_status" NOT NULL DEFAULT 'offline',
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "team_members" ADD CONSTRAINT "team_members_email_unique" UNIQUE ("email");
CREATE INDEX "team_members_status_idx" ON "team_members" ("status");

