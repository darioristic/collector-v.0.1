-- Align invoice_items structure with sales.schema.ts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'unit'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "unit" text NOT NULL DEFAULT 'pcs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "discount_rate" numeric(6,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "vat_rate" numeric(6,2) NOT NULL DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'total_excl_vat'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "total_excl_vat" numeric(14,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'vat_amount'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "vat_amount" numeric(14,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'total_incl_vat'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "total_incl_vat" numeric(14,2) NOT NULL DEFAULT 0;
  END IF;

  -- Ensure quantity uses numeric to match schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE "invoice_items" ALTER COLUMN "quantity" TYPE numeric(14,2) USING quantity::numeric;
    ALTER TABLE "invoice_items" ALTER COLUMN "quantity" SET DEFAULT 1;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "invoice_items_invoice_idx" ON "invoice_items" ("invoice_id");