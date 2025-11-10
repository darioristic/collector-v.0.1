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
  "tax_id" text NOT NULL DEFAULT '',
  "country" text NOT NULL DEFAULT 'RS',
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_email_key" ON "accounts" ("email");
CREATE INDEX IF NOT EXISTS "accounts_owner_idx" ON "accounts" ("owner_id");

ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "tax_id" text NOT NULL DEFAULT '';
ALTER TABLE "accounts" ALTER COLUMN "tax_id" SET DEFAULT '';
ALTER TABLE "accounts" ALTER COLUMN "tax_id" SET NOT NULL;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "country" text NOT NULL DEFAULT 'RS';
ALTER TABLE "accounts" ALTER COLUMN "country" SET DEFAULT 'RS';
ALTER TABLE "accounts" ALTER COLUMN "country" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "account_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "first_name" text NOT NULL DEFAULT '',
  "last_name" text NOT NULL DEFAULT '',
  "title" text,
  "email" text,
  "phone" text,
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_contacts_account_idx" ON "account_contacts" ("account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_contacts_email_key" ON "account_contacts" ("email");

ALTER TABLE "account_contacts" ADD COLUMN IF NOT EXISTS "first_name" text NOT NULL DEFAULT '';
ALTER TABLE "account_contacts" ALTER COLUMN "first_name" SET DEFAULT '';
ALTER TABLE "account_contacts" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "account_contacts" ADD COLUMN IF NOT EXISTS "last_name" text NOT NULL DEFAULT '';
ALTER TABLE "account_contacts" ALTER COLUMN "last_name" SET DEFAULT '';
ALTER TABLE "account_contacts" ALTER COLUMN "last_name" SET NOT NULL;
