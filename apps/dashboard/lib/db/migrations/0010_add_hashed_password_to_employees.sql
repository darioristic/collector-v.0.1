ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "hashed_password" text NOT NULL DEFAULT '';

