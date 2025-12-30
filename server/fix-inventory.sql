-- Fix missing inventory data with correct column names
INSERT INTO inventory (product_id, warehouse_id, quantity, min_stock_level, reorder_point)
SELECT p.id, 1, 1000, 10, 50
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id);

-- Check results
SELECT 'Products with inventory:' as status, count(*) as count 
FROM products p 
JOIN inventory i ON p.id = i.product_id;