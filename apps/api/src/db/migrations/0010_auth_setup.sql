ALTER TYPE "role_key" ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE "role_key" ADD VALUE IF NOT EXISTS 'user';

CREATE TABLE IF NOT EXISTS "companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "domain" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key" ON "companies" ("slug");
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" ("name");

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "hashed_password" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "default_company_id" uuid;

ALTER TABLE "users"
  ADD CONSTRAINT IF NOT EXISTS "users_default_company_id_companies_id_fk"
  FOREIGN KEY ("default_company_id")
  REFERENCES "companies"("id")
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "users_default_company_idx" ON "users" ("default_company_id");

CREATE TABLE IF NOT EXISTS "company_users" (
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" uuid REFERENCES "roles"("id") ON DELETE SET NULL,
  "role_key" "role_key" NOT NULL DEFAULT 'viewer',
  "invited_at" timestamptz,
  "joined_at" timestamptz NOT NULL DEFAULT NOW(),
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "company_users_company_user_key" UNIQUE ("company_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "company_users_role_idx" ON "company_users" ("role_key");

CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" uuid REFERENCES "companies"("id") ON DELETE SET NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_sessions_token_key" ON "auth_sessions" ("token");
CREATE INDEX IF NOT EXISTS "auth_sessions_user_idx" ON "auth_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "auth_sessions_expires_at_idx" ON "auth_sessions" ("expires_at");

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "issued_for_session_id" uuid REFERENCES "auth_sessions"("id") ON DELETE SET NULL,
  "token" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens" ("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "password_reset_tokens" ("user_id");


