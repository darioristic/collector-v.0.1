CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" ("name");

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "display_name" text,
  "email" text NOT NULL,
  "role" text NOT NULL DEFAULT 'MEMBER',
  "status" text NOT NULL DEFAULT 'offline',
  "avatar_url" text,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_company_idx" ON "users" ("company_id");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" ("status");

CREATE TABLE IF NOT EXISTS "channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "is_private" boolean NOT NULL DEFAULT false,
  "metadata" text,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "channels_company_idx" ON "channels" ("company_id");
CREATE INDEX IF NOT EXISTS "channels_name_idx" ON "channels" ("name");

CREATE TABLE IF NOT EXISTS "channel_members" (
  "channel_id" uuid NOT NULL REFERENCES "channels"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "joined_at" timestamptz DEFAULT now() NOT NULL,
  "last_read_at" timestamptz,
  CONSTRAINT "channel_members_pk" PRIMARY KEY ("channel_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "channel_members_channel_idx" ON "channel_members" ("channel_id");
CREATE INDEX IF NOT EXISTS "channel_members_user_idx" ON "channel_members" ("user_id");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" text,
  "file_url" text,
  "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "channel_id" uuid NOT NULL REFERENCES "channels"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "messages_channel_idx" ON "messages" ("channel_id");
CREATE INDEX IF NOT EXISTS "messages_sender_idx" ON "messages" ("sender_id");


