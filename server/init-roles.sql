-- Initialize default roles if they don't exist
INSERT INTO roles (id, name, description) VALUES 
(1, 'SUPER_ADMIN', 'Super Administrator with full system access'),
(2, 'ADMIN', 'Administrator with management access'),
(3, 'USER', 'Regular user with basic access')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to ensure proper auto-increment
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- Create default warehouse if it doesn't exist
INSERT INTO warehouses (id, name, location, is_active) VALUES 
(1, 'Main Warehouse', 'Default Location', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));