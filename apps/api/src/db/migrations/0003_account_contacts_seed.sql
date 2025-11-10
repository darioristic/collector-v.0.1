CREATE TABLE IF NOT EXISTS "account_contacts" (
  "id" uuid PRIMARY KEY,
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "title" text,
  "email" text,
  "phone" text,
  "owner_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_contacts_account_idx" ON "account_contacts" ("account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_contacts_email_key" ON "account_contacts" ("email");

INSERT INTO "account_contacts" (
  "id",
  "account_id",
  "name",
  "title",
  "email",
  "phone",
  "owner_id",
  "created_at",
  "updated_at"
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Stern Thireau',
    'Operations Manager',
    'sthireau@acme.example',
    '+1-555-1001',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'Durward Guenther',
    'Electrical Supervisor',
    'dguenther@acme.example',
    '+1-555-1002',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000002',
    'Ford McKibbin',
    'Project Manager',
    'fmckibbin@collector.example',
    '+1-555-1003',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;
