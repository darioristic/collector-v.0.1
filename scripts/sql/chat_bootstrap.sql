-- Chat service minimal bootstrap (tables + enums if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_type') THEN
    CREATE TYPE chat_message_type AS ENUM ('text','file','image','video','sound');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_status') THEN
    CREATE TYPE chat_message_status AS ENUM ('sent','delivered','read');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  domain text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teamchat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  display_name text,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER',
  status text NOT NULL DEFAULT 'offline',
  avatar_url text,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS teamchat_users_email_unique ON teamchat_users(email);
CREATE INDEX IF NOT EXISTS teamchat_users_company_idx ON teamchat_users(company_id);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES teamchat_users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES teamchat_users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_users_unique ON chat_conversations(user_id_1, user_id_2, company_id);
CREATE INDEX IF NOT EXISTS chat_conversations_company_idx ON chat_conversations(company_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES teamchat_users(id) ON DELETE CASCADE,
  content text,
  type chat_message_type NOT NULL DEFAULT 'text',
  status chat_message_status NOT NULL DEFAULT 'sent',
  file_url text,
  file_metadata text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON chat_messages(sender_id);