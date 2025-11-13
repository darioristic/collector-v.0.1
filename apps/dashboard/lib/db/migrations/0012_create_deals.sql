-- Create deal_stage enum
CREATE TYPE IF NOT EXISTS "deal_stage" AS ENUM ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost');

-- Create deals table
CREATE TABLE IF NOT EXISTS "deals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "company" text NOT NULL,
  "owner" text NOT NULL,
  "stage" "deal_stage" NOT NULL,
  "value" double precision DEFAULT 0 NOT NULL,
  "close_date" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals" ("stage");
CREATE INDEX IF NOT EXISTS "deals_owner_idx" ON "deals" ("owner");
CREATE INDEX IF NOT EXISTS "deals_created_idx" ON "deals" ("created_at");

