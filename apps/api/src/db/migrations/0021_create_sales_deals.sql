CREATE TABLE IF NOT EXISTS "sales_deals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunity_id" uuid NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "description" text,
  "closed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "sales_deals_opportunity_key" ON "sales_deals" ("opportunity_id");