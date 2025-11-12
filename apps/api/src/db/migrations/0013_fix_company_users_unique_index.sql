-- Fix company_users unique index if it doesn't exist
-- This migration ensures that the unique index exists for ON CONFLICT to work

-- Drop existing constraint if it exists (constraint-based unique)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'company_users_company_user_key'
  ) THEN
    ALTER TABLE "company_users" 
    DROP CONSTRAINT IF EXISTS "company_users_company_user_key";
  END IF;
END $$;

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "company_users_company_user_key" 
ON "company_users" ("company_id", "user_id");

