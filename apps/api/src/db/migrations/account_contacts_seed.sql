INSERT INTO "account_contacts" (
  "id",
  "account_id",
  "name",
  "first_name",
  "last_name",
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
    'Stern',
    'Thireau',
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
    'Durward',
    'Guenther',
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
    'Ford',
    'McKibbin',
    'Project Manager',
    'fmckibbin@collector.example',
    '+1-555-1003',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;
