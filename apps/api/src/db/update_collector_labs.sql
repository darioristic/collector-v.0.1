-- Update Collector Labs with registration number and address
-- This script can be run directly against the database

-- Update registration number for Collector Labs
UPDATE "accounts"
SET 
  "registration_number" = '123456/2024',
  "updated_at" = NOW()
WHERE "name" = 'Collector Labs' AND "email" = 'info@collectorlabs.test';

-- Ensure Collector Labs has a primary address
-- First, try to update existing primary address
UPDATE "account_addresses" aa
SET 
  "street" = 'Bulevar kralja Aleksandra 1',
  "city" = 'Beograd',
  "state" = 'Srbija',
  "postal_code" = '11000',
  "country" = 'RS'
FROM "accounts" a
WHERE aa.account_id = a.id
  AND aa.label = 'primary'
  AND a.name = 'Collector Labs'
  AND a.email = 'info@collectorlabs.test';

-- If no primary address exists, insert one
INSERT INTO "account_addresses" (
  "id",
  "account_id",
  "label",
  "street",
  "city",
  "state",
  "postal_code",
  "country",
  "created_at"
)
SELECT
  COALESCE(
    (SELECT id FROM "account_addresses" WHERE account_id = a.id AND label = 'primary'),
    '00000000-0000-0000-0000-000000001000'::uuid
  ),
  a.id,
  'primary',
  'Bulevar kralja Aleksandra 1',
  'Beograd',
  'Srbija',
  '11000',
  'RS',
  NOW()
FROM "accounts" a
WHERE a.name = 'Collector Labs' 
  AND a.email = 'info@collectorlabs.test'
  AND NOT EXISTS (
    SELECT 1 FROM "account_addresses" aa
    WHERE aa.account_id = a.id AND aa.label = 'primary'
  )
ON CONFLICT ("id") DO UPDATE SET
  "street" = EXCLUDED."street",
  "city" = EXCLUDED."city",
  "state" = EXCLUDED."state",
  "postal_code" = EXCLUDED."postal_code",
  "country" = EXCLUDED."country";

