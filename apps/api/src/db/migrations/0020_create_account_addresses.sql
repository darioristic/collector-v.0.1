CREATE TABLE IF NOT EXISTS "account_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "label" text NOT NULL DEFAULT 'primary',
  "street" text,
  "city" text,
  "state" text,
  "postal_code" text,
  "country" text,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_addresses_account_idx" ON "account_addresses" ("account_id");

-- Ensure columns exist when table was created previously
ALTER TABLE "account_addresses" ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7);
ALTER TABLE "account_addresses" ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7);