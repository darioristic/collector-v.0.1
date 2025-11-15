-- Add missing invoice_number column to invoices table and backfill values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE "invoices" ADD COLUMN "invoice_number" text;

    WITH numbered AS (
      SELECT id,
             issued_at,
             ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
      FROM invoices
    )
    UPDATE invoices i
    SET invoice_number = (
      SELECT 'INV-' || to_char(n.issued_at, 'YYYY') || '-' || LPAD(n.rn::text, 4, '0')
      FROM numbered n
      WHERE n.id = i.id
    )
    WHERE i.invoice_number IS NULL;

    ALTER TABLE "invoices" ALTER COLUMN "invoice_number" SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_key" ON "invoices" ("invoice_number");
  END IF;
END $$;