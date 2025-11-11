-- Create all enum types if they don't exist
-- This script is idempotent and can be run multiple times

DO $$ BEGIN

-- CRM enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_stage') THEN
  CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closedWon', 'closedLost');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
  CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_type') THEN
  CREATE TYPE client_activity_type AS ENUM ('call', 'meeting', 'task', 'follow_up');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_status') THEN
  CREATE TYPE client_activity_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_activity_priority') THEN
  CREATE TYPE client_activity_priority AS ENUM ('high', 'medium', 'low');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage') THEN
  CREATE TYPE deal_stage AS ENUM ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost');
END IF;

-- Sales enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
  CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
  CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'fulfilled', 'pending', 'processing', 'shipped', 'completed', 'cancelled');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
  CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cash', 'card', 'crypto');
END IF;

-- Accounts enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
  CREATE TYPE account_type AS ENUM ('customer', 'partner', 'vendor');
END IF;

-- Products enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
  CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');
END IF;

-- Projects enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
  CREATE TYPE project_status AS ENUM ('planned', 'active', 'on_hold', 'completed');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
END IF;

-- Settings/Auth enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'invited');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_key') THEN
  CREATE TYPE role_key AS ENUM ('admin', 'manager', 'user', 'sales_manager', 'sales_rep', 'support', 'viewer');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
  CREATE TYPE integration_provider AS ENUM ('hubspot', 'salesforce', 'slack', 'google');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
  CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error');
END IF;

IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_status') THEN
  CREATE TYPE team_member_status AS ENUM ('online', 'offline', 'idle', 'invited');
END IF;

-- HR enums
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status') THEN
  CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
END IF;

END $$;