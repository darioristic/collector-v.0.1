-- PERFORMANCE OPTIMIZATION MIGRATION
-- Dodaje kompozitne indekse za optimizaciju čestih query-ja.
-- Neke instance mogu imati delimičnu šemu; pomoćne funkcije
-- osiguravaju da migracija ne pada kada tabela/kolona nedostaje.

CREATE OR REPLACE FUNCTION crm_try_create_index(index_sql text) RETURNS void AS $$
BEGIN
	EXECUTE index_sql;
EXCEPTION
	WHEN undefined_table OR undefined_column OR duplicate_table THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USERS TABLE COMPOSITE INDEXES
-- ============================================

-- Za login query: SELECT * FROM users WHERE email = ? AND status = ?
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status);$$);

-- ============================================
-- LEADS TABLE COMPOSITE INDEXES
-- ============================================

-- Za filter po email i status
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_email_status ON leads(email, status);$$);

-- Za filter po source i status
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_source_status ON leads(source, status) WHERE source IS NOT NULL;$$);

-- Za filter po owner i created_at (za listing sa sortiranjem)
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_leads_owner_created ON leads(owner_id, created_at DESC) WHERE owner_id IS NOT NULL;$$);

-- ============================================
-- AUTH_SESSIONS TABLE COMPOSITE INDEXES
-- ============================================

-- Za lookup session po user i expires_at
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expires ON auth_sessions(user_id, expires_at);$$);

-- Partial index za cleanup expired sessions (WHERE expires_at > NOW())
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at) WHERE expires_at > NOW();$$);

-- ============================================
-- PRODUCTS TABLE COMPOSITE INDEXES
-- ============================================

-- Za filter po category i status
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status) WHERE category_id IS NOT NULL;$$);

-- ============================================
-- INVENTORY_ITEMS TABLE COMPOSITE INDEXES
-- ============================================

-- Za lookup po product i location
SELECT crm_try_create_index($$CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory_items(product_id, location_id);$$);

-- ============================================
-- CLEANUP
-- ============================================

DROP FUNCTION IF EXISTS crm_try_create_index(text);

