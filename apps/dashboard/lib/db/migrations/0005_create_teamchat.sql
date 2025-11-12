CREATE TABLE IF NOT EXISTS "teamchat_users" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "teamchat_users_email_unique" ON "teamchat_users" ("email");
CREATE INDEX IF NOT EXISTS "teamchat_users_company_idx" ON "teamchat_users" ("company_id");
CREATE INDEX IF NOT EXISTS "teamchat_users_status_idx" ON "teamchat_users" ("status");

CREATE TABLE IF NOT EXISTS "teamchat_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "is_private" boolean NOT NULL DEFAULT false,
  "metadata" text,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "teamchat_channels_company_idx" ON "teamchat_channels" ("company_id");
CREATE INDEX IF NOT EXISTS "teamchat_channels_name_idx" ON "teamchat_channels" ("name");

CREATE TABLE IF NOT EXISTS "teamchat_channel_members" (
  "channel_id" uuid NOT NULL REFERENCES "teamchat_channels"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "teamchat_users"("id") ON DELETE CASCADE,
  "joined_at" timestamptz DEFAULT now() NOT NULL,
  "last_read_at" timestamptz,
  CONSTRAINT "teamchat_channel_members_pk" PRIMARY KEY ("channel_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "teamchat_channel_members_channel_idx" ON "teamchat_channel_members" ("channel_id");
CREATE INDEX IF NOT EXISTS "teamchat_channel_members_user_idx" ON "teamchat_channel_members" ("user_id");

CREATE TABLE IF NOT EXISTS "teamchat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" text,
  "file_url" text,
  "sender_id" uuid NOT NULL REFERENCES "teamchat_users"("id") ON DELETE CASCADE,
  "channel_id" uuid NOT NULL REFERENCES "teamchat_channels"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "teamchat_messages_channel_idx" ON "teamchat_messages" ("channel_id");
CREATE INDEX IF NOT EXISTS "teamchat_messages_sender_idx" ON "teamchat_messages" ("sender_id");


