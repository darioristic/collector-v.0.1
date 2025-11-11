CREATE TYPE IF NOT EXISTS "project_status" AS ENUM ('planned', 'active', 'on_hold', 'completed');
CREATE TYPE IF NOT EXISTS "task_status" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text,
  "customer" text,
  "status" "project_status" NOT NULL DEFAULT 'planned',
  "start_date" timestamptz,
  "due_date" timestamptz,
  "budget_total" numeric(12, 2) DEFAULT 0,
  "budget_spent" numeric(12, 2) DEFAULT 0,
  "budget_currency" text DEFAULT 'EUR',
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "projects_name_owner_key" ON "projects" ("name", "owner_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status");

CREATE TABLE IF NOT EXISTS "project_members" (
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'contributor',
  "added_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_members_project_user_key"
  ON "project_members" ("project_id", "user_id");

CREATE TABLE IF NOT EXISTS "project_milestones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "due_date" timestamptz,
  "status" "task_status" NOT NULL DEFAULT 'todo',
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "project_milestones_project_idx"
  ON "project_milestones" ("project_id");

CREATE TABLE IF NOT EXISTS "project_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "milestone_id" uuid REFERENCES "project_milestones"("id") ON DELETE SET NULL,
  "assignee_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "description" text,
  "status" "task_status" NOT NULL DEFAULT 'todo',
  "due_date" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "project_tasks_project_idx"
  ON "project_tasks" ("project_id");

CREATE INDEX IF NOT EXISTS "project_tasks_assignee_idx"
  ON "project_tasks" ("assignee_id");

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

