-- Migration: Create invoice_links table for unique link management
-- This table stores shareable links for invoices with token-based access

CREATE TABLE IF NOT EXISTS "invoice_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone,
  "viewed_at" timestamp with time zone,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_links_token_idx" ON "invoice_links" ("token");
CREATE INDEX IF NOT EXISTS "invoice_links_invoice_idx" ON "invoice_links" ("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_links_expires_at_idx" ON "invoice_links" ("expires_at");

-- Add comment for documentation
COMMENT ON TABLE "invoice_links" IS 'Stores shareable links for invoices with token-based access and view tracking';
COMMENT ON COLUMN "invoice_links"."token" IS 'Unique token for accessing the invoice via public link';
COMMENT ON COLUMN "invoice_links"."expires_at" IS 'Optional expiration date for the link';
COMMENT ON COLUMN "invoice_links"."viewed_at" IS 'Timestamp of the first view';
COMMENT ON COLUMN "invoice_links"."view_count" IS 'Number of times the invoice has been viewed via this link';

