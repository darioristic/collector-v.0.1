DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_stage') THEN
        CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closedWon', 'closedLost');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_type') THEN
        CREATE TYPE client_activity_type AS ENUM ('call', 'meeting', 'task', 'follow_up');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_status') THEN
        CREATE TYPE client_activity_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_priority') THEN
        CREATE TYPE client_activity_priority AS ENUM ('high', 'medium', 'low');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    name text NOT NULL,
    email text NOT NULL,
    status lead_status NOT NULL DEFAULT 'new',
    source text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_email_key ON leads(email);
CREATE INDEX IF NOT EXISTS leads_account_idx ON leads(account_id);
CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads(owner_id);

CREATE TABLE IF NOT EXISTS opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title text NOT NULL,
    stage opportunity_stage NOT NULL DEFAULT 'qualification',
    value numeric(12, 2) NOT NULL DEFAULT 0,
    probability numeric(5, 2) NOT NULL DEFAULT 0,
    close_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opportunities_account_idx ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS opportunities_owner_idx ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities(stage);

CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type activity_type NOT NULL DEFAULT 'call',
    subject text NOT NULL,
    notes text,
    date timestamptz NOT NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    related_to text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_owner_idx ON activities(owner_id);
CREATE INDEX IF NOT EXISTS activities_related_idx ON activities(related_to);

CREATE TABLE IF NOT EXISTS crm_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
    author_id uuid REFERENCES users(id) ON DELETE SET NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_notes_lead_idx ON crm_notes(lead_id);
CREATE INDEX IF NOT EXISTS crm_notes_opportunity_idx ON crm_notes(opportunity_id);

CREATE TABLE IF NOT EXISTS client_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    client_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
    type client_activity_type NOT NULL,
    due_date timestamptz NOT NULL,
    status client_activity_status NOT NULL DEFAULT 'scheduled',
    priority client_activity_priority NOT NULL DEFAULT 'medium',
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_activities_client_idx ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS client_activities_assigned_idx ON client_activities(assigned_to);
CREATE INDEX IF NOT EXISTS client_activities_status_idx ON client_activities(status);
CREATE INDEX IF NOT EXISTS client_activities_due_idx ON client_activities(due_date);
