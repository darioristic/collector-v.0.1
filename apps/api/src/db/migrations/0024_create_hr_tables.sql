-- HR core tables

DO $$ BEGIN
    CREATE TYPE "public"."employment_status" AS ENUM('active', 'on_leave', 'terminated', 'contractor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "employees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "employee_number" text NOT NULL,
  "status" "employment_status" NOT NULL DEFAULT 'active',
  "department" text,
  "manager_id" uuid,
  "hired_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "employees_employee_number_key" ON "employees" ("employee_number");
CREATE INDEX IF NOT EXISTS "employees_manager_idx" ON "employees" ("manager_id");

CREATE TABLE IF NOT EXISTS "employee_role_assignments" (
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "assigned_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "employee_role_assignments_employee_role_key"
  ON "employee_role_assignments" ("employee_id", "role_id");

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "date" timestamptz NOT NULL,
  "status" text NOT NULL DEFAULT 'present',
  "check_in" timestamptz,
  "check_out" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_employee_date_key"
  ON "attendance_records" ("employee_id", "date");

CREATE TABLE IF NOT EXISTS "time_off_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "start_date" timestamptz NOT NULL,
  "end_date" timestamptz NOT NULL,
  "reason" text,
  "status" text NOT NULL DEFAULT 'pending',
  "approved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "time_off_requests_employee_idx" ON "time_off_requests" ("employee_id");
CREATE INDEX IF NOT EXISTS "time_off_requests_approver_idx" ON "time_off_requests" ("approved_by");

CREATE TABLE IF NOT EXISTS "payroll_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "gross_pay" integer NOT NULL,
  "net_pay" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payroll_entries_employee_period_idx"
  ON "payroll_entries" ("employee_id", "period_start", "period_end");