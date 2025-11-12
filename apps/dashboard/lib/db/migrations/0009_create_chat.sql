CREATE TYPE IF NOT EXISTS "chat_message_type" AS ENUM ('text', 'file', 'image', 'video', 'sound');

CREATE TYPE IF NOT EXISTS "chat_message_status" AS ENUM ('sent', 'delivered', 'read');

CREATE TABLE IF NOT EXISTS "chat_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id_1" uuid NOT NULL REFERENCES "teamchat_users"("id") ON DELETE CASCADE,
  "user_id_2" uuid NOT NULL REFERENCES "teamchat_users"("id") ON DELETE CASCADE,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "last_message_at" timestamptz,
  "last_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_users_unique" ON "chat_conversations" ("user_id_1", "user_id_2", "company_id");
CREATE INDEX IF NOT EXISTS "chat_conversations_user1_idx" ON "chat_conversations" ("user_id_1");
CREATE INDEX IF NOT EXISTS "chat_conversations_user2_idx" ON "chat_conversations" ("user_id_2");
CREATE INDEX IF NOT EXISTS "chat_conversations_company_idx" ON "chat_conversations" ("company_id");

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
  "sender_id" uuid NOT NULL REFERENCES "teamchat_users"("id") ON DELETE CASCADE,
  "content" text,
  "type" "chat_message_type" NOT NULL DEFAULT 'text',
  "status" "chat_message_status" NOT NULL DEFAULT 'sent',
  "file_url" text,
  "file_metadata" text,
  "read_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_messages_conversation_idx" ON "chat_messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" ("created_at");

