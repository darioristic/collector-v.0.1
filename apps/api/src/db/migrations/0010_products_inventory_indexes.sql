-- ============================================
-- PRODUCTS & INVENTORY OPTIMIZATION INDEXES
-- ============================================

CREATE OR REPLACE FUNCTION products_try_create_index(index_sql text) RETURNS void AS $$
BEGIN
	EXECUTE index_sql;
EXCEPTION
	WHEN undefined_table OR undefined_column OR invalid_schema_name THEN
		NULL;
END;
$$ LANGUAGE plpgsql;

SELECT products_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products(category_id)
  WHERE category_id IS NOT NULL;$$);

SELECT products_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_status_flag
  ON products(status);$$);

SELECT products_try_create_index($$CREATE INDEX IF NOT EXISTS idx_products_created_at_desc
  ON products(created_at DESC);$$);

SELECT products_try_create_index($$CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id
  ON inventory_items(product_id);$$);

SELECT products_try_create_index($$CREATE INDEX IF NOT EXISTS idx_inventory_items_location_id
  ON inventory_items(location_id);$$);

DROP FUNCTION IF EXISTS products_try_create_index(text);
