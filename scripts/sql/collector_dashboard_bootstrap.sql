CREATE TABLE IF NOT EXISTS auth_sessions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

ALTER TABLE company_users ADD COLUMN IF NOT EXISTS role_key text NOT NULL DEFAULT 'admin';