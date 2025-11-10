CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'invited');
CREATE TYPE "account_type" AS ENUM ('company', 'individual');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "name" text NOT NULL,
  "status" "user_status" NOT NULL DEFAULT 'invited',
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" "account_type" NOT NULL DEFAULT 'company',
  "email" text NOT NULL,
  "phone" text,
  "website" text,
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_email_key" ON "accounts" ("email");
CREATE INDEX IF NOT EXISTS "accounts_owner_idx" ON "accounts" ("owner_id");
