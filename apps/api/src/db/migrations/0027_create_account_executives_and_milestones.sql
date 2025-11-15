CREATE TABLE IF NOT EXISTS "account_executives" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "title" text,
  "email" text,
  "phone" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_executives_account_idx" ON "account_executives" ("account_id");

CREATE TABLE IF NOT EXISTS "account_milestones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "date" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_milestones_account_idx" ON "account_milestones" ("account_id");

