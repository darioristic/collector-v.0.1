-- PERFORMANCE OPTIMIZATION MIGRATION
-- Dodaje indekse za optimizaciju query performansi.
-- Neke instance mogu imati delimičnu šemu (npr. samo CRM modul); pomoćne funkcije
-- u nastavku osiguravaju da migracija ne pada kada tabela/kolona nedostaje.

CREATE OR REPLACE FUNCTION crm_try_create_index(index_sql text) RETURNS void AS $$
BEGIN
	EXECUTE index_sql;
EXCEPTION
	WHEN undefined_table OR undefined_column THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crm_try_analyze(table_name text) RETURNS void AS $$
BEGIN
	EXECUTE format('ANALYZE %I', table_name);
EXCEPTION
	WHEN undefined_table THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ORDERS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_contact_id ON orders(contact_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_orders_company_status ON orders(company_id, status) WHERE company_id IS NOT NULL;$$);

-- ============================================
-- ORDER ITEMS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;$$);

-- ============================================
-- QUOTES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_contact_id ON quotes(contact_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON quotes(issue_date DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_expiry_date ON quotes(expiry_date);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quotes_company_status ON quotes(company_id, status) WHERE company_id IS NOT NULL;$$);

-- ============================================
-- QUOTE ITEMS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id) WHERE product_id IS NOT NULL;$$);

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);$$);

-- ============================================
-- INVOICE ITEMS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);$$);

-- ============================================
-- PROJECTS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id) WHERE owner_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id) WHERE account_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at ASC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date) WHERE start_date IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date) WHERE due_date IS NOT NULL;$$);

-- ============================================
-- PROJECT TASKS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON project_tasks(assignee_id) WHERE assignee_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date) WHERE due_date IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON project_tasks(created_at ASC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_tasks_project_status ON project_tasks(project_id, status);$$);

-- ============================================
-- PROJECT MEMBERS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);$$);

-- ============================================
-- PROJECT MILESTONES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date) WHERE due_date IS NOT NULL;$$);

-- ============================================
-- PROJECT BUDGET CATEGORIES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_project_budget_categories_project_id ON project_budget_categories(project_id);$$);

-- ============================================
-- CRM - LEADS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id) WHERE company_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id) WHERE contact_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id) WHERE owner_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority) WHERE priority IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);$$);

-- ============================================
-- CRM - OPPORTUNITIES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id) WHERE company_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id) WHERE contact_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON opportunities(owner_id) WHERE owner_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage) WHERE stage IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date ON opportunities(expected_close_date) WHERE expected_close_date IS NOT NULL;$$);

-- ============================================
-- CRM - ACTIVITIES TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id) WHERE company_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id) WHERE contact_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id) WHERE lead_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON activities(opportunity_id) WHERE opportunity_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id) WHERE owner_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date) WHERE due_date IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_activities_owner_date ON activities(owner_id, due_date) WHERE owner_id IS NOT NULL AND due_date IS NOT NULL;$$);

-- ============================================
-- ACCOUNTS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_accounts_name_gin ON accounts USING gin(name gin_trgm_ops);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type) WHERE type IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at DESC);$$);

-- ============================================
-- ACCOUNT CONTACTS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_account_contacts_account_id ON account_contacts(account_id) WHERE account_id IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_account_contacts_full_name_gin ON account_contacts USING gin(full_name gin_trgm_ops);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_account_contacts_email ON account_contacts(email) WHERE email IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_account_contacts_created_at ON account_contacts(created_at DESC);$$);

-- ============================================
-- PRODUCTS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(name gin_trgm_ops);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE category IS NOT NULL;$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);$$);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);$$);
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status IS NOT NULL;$$);

-- ============================================
-- ENABLE pg_trgm EXTENSION FOR TEXT SEARCH
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ANALYZE TABLES
-- ============================================

SELECT crm_try_analyze('orders');
SELECT crm_try_analyze('order_items');
SELECT crm_try_analyze('quotes');
SELECT crm_try_analyze('quote_items');
SELECT crm_try_analyze('invoices');
SELECT crm_try_analyze('invoice_items');
SELECT crm_try_analyze('projects');
SELECT crm_try_analyze('project_tasks');
SELECT crm_try_analyze('project_members');
SELECT crm_try_analyze('project_milestones');
SELECT crm_try_analyze('project_budget_categories');
SELECT crm_try_analyze('leads');
SELECT crm_try_analyze('opportunities');
SELECT crm_try_analyze('activities');
SELECT crm_try_analyze('accounts');
SELECT crm_try_analyze('account_contacts');
SELECT crm_try_analyze('products');
SELECT crm_try_analyze('users');

DROP FUNCTION IF EXISTS crm_try_create_index(text);
DROP FUNCTION IF EXISTS crm_try_analyze(text);