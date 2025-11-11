ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "customer" text,
  ADD COLUMN IF NOT EXISTS "budget_total" numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "budget_spent" numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "budget_currency" text DEFAULT 'EUR';

CREATE TABLE IF NOT EXISTS "project_budget_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "allocated_amount" numeric(12, 2) NOT NULL DEFAULT 0,
  "spent_amount" numeric(12, 2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "project_budget_categories_project_idx"
  ON "project_budget_categories" ("project_id");

CREATE INDEX IF NOT EXISTS "project_budget_categories_category_idx"
  ON "project_budget_categories" ("category");

ALTER TABLE "project_milestones"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT NOW();

