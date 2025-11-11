ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "company_id" uuid;

ALTER TABLE "team_members"
  ADD CONSTRAINT IF NOT EXISTS "team_members_company_fk"
  FOREIGN KEY ("company_id")
  REFERENCES "companies"("id")
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "team_members_company_idx"
  ON "team_members" ("company_id");

DROP INDEX IF EXISTS "team_members_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_company_email_key"
  ON "team_members" ("company_id", "email");
