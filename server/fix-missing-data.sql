-- Check and create missing data for order placement
-- Run this to fix the 500 error

-- 1. Ensure roles exist
INSERT INTO roles (id, name, description) VALUES 
(1, 'SUPER_ADMIN', 'Super Administrator'),
(2, 'ADMIN', 'Administrator'),
(3, 'USER', 'Regular User')
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure warehouse exists
INSERT INTO warehouses (id, name, location, is_active) VALUES 
(1, 'Main Warehouse', 'Default Location', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create inventory records for all products that don't have them
INSERT INTO inventory (product_id, warehouse_id, quantity_on_hand, low_stock_threshold, reorder_quantity)
SELECT p.id, 1, 1000, 10, 50
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id);

-- 4. Check data
SELECT 'Roles:' as table_name, count(*) as count FROM roles
UNION ALL
SELECT 'Warehouses:', count(*) FROM warehouses
UNION ALL
SELECT 'Products:', count(*) FROM products
UNION ALL
SELECT 'Inventory:', count(*) FROM inventory;