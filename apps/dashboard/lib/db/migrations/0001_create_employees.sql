CREATE TYPE "employment_type" AS ENUM ('Full-time', 'Contractor', 'Intern');

CREATE TYPE "employment_status" AS ENUM ('Active', 'On Leave', 'Terminated');

CREATE TABLE "employees" (
  "id" serial PRIMARY KEY,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "department" varchar(100),
  "role" varchar(100),
  "employment_type" "employment_type" NOT NULL DEFAULT 'Full-time',
  "status" "employment_status" NOT NULL DEFAULT 'Active',
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone,
  "salary" numeric(12, 2),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE ("email");

CREATE INDEX "employees_department_idx" ON "employees" ("department");
CREATE INDEX "employees_status_idx" ON "employees" ("status");
CREATE INDEX "employees_employment_type_idx" ON "employees" ("employment_type");
CREATE INDEX "employees_start_date_idx" ON "employees" ("start_date");

