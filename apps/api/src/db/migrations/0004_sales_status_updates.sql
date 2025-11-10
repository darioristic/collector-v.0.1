DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    BEGIN
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    BEGIN
      ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'unpaid';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;
