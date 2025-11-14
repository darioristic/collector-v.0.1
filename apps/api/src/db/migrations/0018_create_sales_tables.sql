-- Create sales-related enums if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('draft','confirmed','fulfilled','pending','processing','shipped','completed','cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft','sent','paid','overdue','void','unpaid');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('bank_transfer','cash','card','crypto');
  END IF;
END $$;

-- Quotes
CREATE TABLE IF NOT EXISTS "quotes" (
  "id" serial PRIMARY KEY,
  "quote_number" text NOT NULL UNIQUE,
  "company_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
  "contact_id" uuid REFERENCES "account_contacts"("id") ON DELETE SET NULL,
  "issue_date" date DEFAULT CURRENT_DATE,
  "expiry_date" date,
  "currency" text NOT NULL DEFAULT 'EUR',
  "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
  "tax" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "status" quote_status NOT NULL DEFAULT 'draft',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "quotes_company_idx" ON "quotes" ("company_id");
CREATE INDEX IF NOT EXISTS "quotes_contact_idx" ON "quotes" ("contact_id");

-- Quote items
CREATE TABLE IF NOT EXISTS "quote_items" (
  "id" serial PRIMARY KEY,
  "quote_id" integer NOT NULL REFERENCES "quotes"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "description" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "quote_items_quote_idx" ON "quote_items" ("quote_id");
CREATE INDEX IF NOT EXISTS "quote_items_product_idx" ON "quote_items" ("product_id");

-- Orders
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "order_number" text NOT NULL UNIQUE,
  "quote_id" integer REFERENCES "quotes"("id") ON DELETE SET NULL,
  "company_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
  "contact_id" uuid REFERENCES "account_contacts"("id") ON DELETE SET NULL,
  "order_date" date DEFAULT CURRENT_DATE,
  "expected_delivery" date,
  "currency" text NOT NULL DEFAULT 'EUR',
  "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
  "tax" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "status" order_status NOT NULL DEFAULT 'draft',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "orders_company_idx" ON "orders" ("company_id");
CREATE INDEX IF NOT EXISTS "orders_contact_idx" ON "orders" ("contact_id");
CREATE INDEX IF NOT EXISTS "orders_quote_idx" ON "orders" ("quote_id");

-- Order items
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "description" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" ("product_id");

-- Invoices
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "customer_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "customer_name" text NOT NULL,
  "customer_email" text,
  "billing_address" text,
  "status" invoice_status NOT NULL DEFAULT 'draft',
  "issued_at" timestamptz NOT NULL DEFAULT NOW(),
  "due_date" timestamptz,
  "amount_before_discount" numeric(14,2) NOT NULL DEFAULT 0,
  "discount_total" numeric(14,2) NOT NULL DEFAULT 0,
  "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
  "total_vat" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "amount_paid" numeric(14,2) NOT NULL DEFAULT 0,
  "balance" numeric(14,2) NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'EUR',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_order_key" ON "invoices" ("order_id");

-- Invoice items
CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(14,2) NOT NULL DEFAULT 0,
  "total" numeric(14,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "invoice_items_invoice_idx" ON "invoice_items" ("invoice_id");

-- Payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "company_id" uuid REFERENCES "accounts"("id") ON DELETE SET NULL,
  "contact_id" uuid REFERENCES "account_contacts"("id") ON DELETE SET NULL,
  "status" payment_status NOT NULL DEFAULT 'completed',
  "amount" numeric(14,2) NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'EUR',
  "method" payment_method NOT NULL DEFAULT 'bank_transfer',
  "reference" text,
  "notes" text,
  "payment_date" date NOT NULL DEFAULT CURRENT_DATE,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payments_invoice_idx" ON "payments" ("invoice_id");
CREATE INDEX IF NOT EXISTS "payments_company_idx" ON "payments" ("company_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");