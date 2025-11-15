-- Update Collector Labs with registration number and address
UPDATE "accounts"
SET 
  "registration_number" = '123456/2024',
  "updated_at" = NOW()
WHERE "name" = 'Collector Labs' AND "email" = 'info@collectorlabs.test';

-- Ensure Collector Labs has a primary address
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
  '00000000-0000-0000-0000-000000001000'::uuid,
  a.id,
  'primary',
  'Bulevar kralja Aleksandra 1',
  'Beograd',
  'Srbija',
  '11000',
  'RS',
  NOW()
FROM "accounts" a
WHERE a.name = 'Collector Labs' AND a.email = 'info@collectorlabs.test'
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

