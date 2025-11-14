ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text;
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_key" ON "invoices" ("invoice_number");