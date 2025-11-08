ALTER TABLE "accounts"
ALTER COLUMN "email" SET NOT NULL;

INSERT INTO "accounts" (
  "id",
  "name",
  "type",
  "email",
  "phone",
  "website",
  "owner_id",
  "created_at",
  "updated_at"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Acme Manufacturing',
    'company',
    'contact@acme.example',
    '+1-555-0101',
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Jane Doe',
    'individual',
    'jane.doe@example.com',
    '+1-555-0123',
    NULL,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;

