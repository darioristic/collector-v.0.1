#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/apps/api/src/db/migrations"
META_DIR="${MIGRATIONS_DIR}/meta"
MIGRATION_FILE="${MIGRATIONS_DIR}/0006_crm_tables.sql"

cat <<'SQL' > "${MIGRATION_FILE}"
DO $$
BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closedWon', 'closedLost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE client_activity_type AS ENUM ('call', 'meeting', 'task', 'follow_up');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE client_activity_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE client_activity_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status lead_status NOT NULL DEFAULT 'new',
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_key ON leads(email);
CREATE INDEX IF NOT EXISTS leads_account_idx ON leads(account_id);
CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads(owner_id);

CREATE TABLE IF NOT EXISTS opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    stage opportunity_stage NOT NULL DEFAULT 'qualification',
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    probability NUMERIC(5, 2) NOT NULL DEFAULT 0,
    close_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS opportunities_account_idx ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS opportunities_owner_idx ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities(stage);

CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type activity_type NOT NULL DEFAULT 'call',
    subject TEXT NOT NULL,
    notes TEXT,
    date TIMESTAMPTZ NOT NULL,
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    related_to TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activities_owner_idx ON activities(owner_id);
CREATE INDEX IF NOT EXISTS activities_related_idx ON activities(related_to);

CREATE TABLE IF NOT EXISTS crm_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
    author_id uuid REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS crm_notes_lead_idx ON crm_notes(lead_id);
CREATE INDEX IF NOT EXISTS crm_notes_opportunity_idx ON crm_notes(opportunity_id);

CREATE TABLE IF NOT EXISTS client_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    client_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
    type client_activity_type NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status client_activity_status NOT NULL DEFAULT 'scheduled',
    priority client_activity_priority NOT NULL DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS client_activities_client_idx ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS client_activities_assigned_idx ON client_activities(assigned_to);
CREATE INDEX IF NOT EXISTS client_activities_status_idx ON client_activities(status);
CREATE INDEX IF NOT EXISTS client_activities_due_idx ON client_activities(due_date);
SQL

cat <<'JSON' > "${META_DIR}/_snapshot.json"
{
  "version": "6",
  "dialect": "postgresql",
  "tables": {
    "users": {},
    "accounts": {},
    "account_contacts": {},
    "deals": {},
    "leads": {},
    "opportunities": {},
    "activities": {},
    "crm_notes": {},
    "client_activities": {}
  },
  "enums": {
    "user_status": {},
    "account_type": {},
    "deal_stage": {},
    "lead_status": {},
    "opportunity_stage": {},
    "activity_type": {},
    "client_activity_type": {},
    "client_activity_status": {},
    "client_activity_priority": {}
  },
  "schemas": {}
}
JSON

cat <<'JSON' > "${META_DIR}/_journal.json"
{
  "version": "6",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "0001",
      "when": 1762502400000,
      "tag": "0001_initial",
      "breakpoints": false
    },
    {
      "idx": 1,
      "version": "0002",
      "when": 1762502400001,
      "tag": "0002_accounts_seed",
      "breakpoints": false
    },
    {
      "idx": 2,
      "version": "0003",
      "when": 1762502400002,
      "tag": "0003_account_contacts_seed",
      "breakpoints": false
    },
    {
      "idx": 3,
      "version": "0004",
      "when": 1762502400003,
      "tag": "0004_sales_status_updates",
      "breakpoints": false
    },
    {
      "idx": 4,
      "version": "0005",
      "when": 1762502400004,
      "tag": "0005_create_deals_table",
      "breakpoints": false
    },
    {
      "idx": 5,
      "version": "0006",
      "when": 1762502400005,
      "tag": "0006_crm_tables",
      "breakpoints": false
    }
  ]
}
JSON

if command -v psql >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  echo "[crm-fix] Removing existing 0006_crm_tables from drizzle.__drizzle_migrations (if any)..."
  psql "${DATABASE_URL}" -c "DELETE FROM drizzle.__drizzle_migrations WHERE migration_name = '0006_crm_tables';" || true
else
  echo "[crm-fix] psql not available or DATABASE_URL unset; skipping deletion from drizzle.__drizzle_migrations."
fi

(
  cd "${REPO_ROOT}/apps/api"
  bun run db:migrate
)
(
  cd "${REPO_ROOT}/apps/api"
  bun run db:seed
)
