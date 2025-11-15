DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE "invoices" ADD COLUMN "invoice_number" text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'invoices_invoice_number_key'
  ) THEN
    CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices" ("invoice_number");
  END IF;
END $$;