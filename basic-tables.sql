-- Create company_users table
CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Insert a default company
INSERT INTO companies (name) VALUES ('Default Company') ON CONFLICT DO NOTHING;

-- Link the test user to the default company
INSERT INTO company_users (user_id, company_id, role) 
SELECT u.id, c.id, 'admin' 
FROM users u, companies c 
WHERE u.email = 'dario@collectorlabs.test' AND c.name = 'Default Company'
ON CONFLICT DO NOTHING;