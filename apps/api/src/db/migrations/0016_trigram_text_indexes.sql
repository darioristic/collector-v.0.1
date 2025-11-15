-- TRIGRAM TEXT SEARCH INDEXES

CREATE OR REPLACE FUNCTION crm_trgm_try_create_index(index_sql text) RETURNS void AS $$
BEGIN
	EXECUTE index_sql;
EXCEPTION
	WHEN undefined_table OR undefined_column OR invalid_schema_name THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crm_trgm_try_drop_index(index_name text) RETURNS void AS $$
BEGIN
	EXECUTE format('DROP INDEX IF EXISTS %I', index_name);
EXCEPTION
	WHEN undefined_table OR invalid_schema_name THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crm_trgm_up() RETURNS void AS $$
BEGIN
	CREATE EXTENSION IF NOT EXISTS pg_trgm;

	-- products
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops)');
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON products USING GIN (sku gin_trgm_ops)');

	-- accounts
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm ON accounts USING GIN (name gin_trgm_ops)');

	-- account_contacts
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_account_contacts_name_trgm ON account_contacts USING GIN (name gin_trgm_ops)');
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_account_contacts_full_name_trgm ON account_contacts USING GIN (full_name gin_trgm_ops)');

	-- leads
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_leads_name_trgm ON leads USING GIN (name gin_trgm_ops)');

	-- orders
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_orders_order_number_trgm ON orders USING GIN (order_number gin_trgm_ops)');

	-- projects
	PERFORM crm_trgm_try_create_index('CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING GIN (name gin_trgm_ops)');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crm_trgm_down() RETURNS void AS $$
BEGIN
	PERFORM crm_trgm_try_drop_index('idx_products_name_trgm');
	PERFORM crm_trgm_try_drop_index('idx_products_sku_trgm');
	PERFORM crm_trgm_try_drop_index('idx_accounts_name_trgm');
	PERFORM crm_trgm_try_drop_index('idx_account_contacts_name_trgm');
	PERFORM crm_trgm_try_drop_index('idx_account_contacts_full_name_trgm');
	PERFORM crm_trgm_try_drop_index('idx_leads_name_trgm');
	PERFORM crm_trgm_try_drop_index('idx_orders_order_number_trgm');
	PERFORM crm_trgm_try_drop_index('idx_projects_name_trgm');
END;
$$ LANGUAGE plpgsql;

SELECT crm_trgm_up();