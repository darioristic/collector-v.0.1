-- ============================================
-- PRODUCTS & INVENTORY OPTIMIZATION INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products(category_id)
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_status_flag
  ON products(status);

CREATE INDEX IF NOT EXISTS idx_products_created_at_desc
  ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id
  ON inventory_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_location_id
  ON inventory_items(location_id);


