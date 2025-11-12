-- Add company_id column to team_members table
ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "company_id" uuid;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_members_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "team_members"
    ADD CONSTRAINT "team_members_company_id_companies_id_fk"
    FOREIGN KEY ("company_id")
    REFERENCES "companies"("id")
    ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old unique index on email only
DROP INDEX IF EXISTS "team_members_email_key";

-- Create new unique index on company_id and email
-- This ensures email uniqueness per company
-- Note: In PostgreSQL, NULL values in unique indexes are treated as distinct,
-- so multiple rows with NULL company_id and same email are allowed
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_company_email_key"
  ON "team_members" ("company_id", "email");

-- Create index on company_id for better query performance
CREATE INDEX IF NOT EXISTS "team_members_company_idx"
  ON "team_members" ("company_id");

