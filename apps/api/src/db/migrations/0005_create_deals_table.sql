DO $$
BEGIN
    CREATE TYPE "deal_stage" AS ENUM (
        'Lead',
        'Qualified',
        'Proposal',
        'Negotiation',
        'Closed Won',
        'Closed Lost'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "deals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "company" text NOT NULL,
    "owner" text NOT NULL,
    "stage" "deal_stage" NOT NULL,
    "value" double precision NOT NULL DEFAULT 0,
    "close_date" timestamptz,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals" ("stage");
CREATE INDEX IF NOT EXISTS "deals_owner_idx" ON "deals" ("owner");
CREATE INDEX IF NOT EXISTS "deals_created_idx" ON "deals" ("created_at");

