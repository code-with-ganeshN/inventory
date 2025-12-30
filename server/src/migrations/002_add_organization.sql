-- Add organization_id to users table
ALTER TABLE users ADD COLUMN organization_id INT REFERENCES organizations(id);

-- Add organization_id to categories table  
ALTER TABLE categories ADD COLUMN created_by INT REFERENCES users(id);
ALTER TABLE categories ADD COLUMN organization_id INT REFERENCES organizations(id);

-- Add organization_id to products table (already has created_by)
ALTER TABLE products ADD COLUMN organization_id INT REFERENCES organizations(id);

-- Create default organization
INSERT INTO organizations (name, description) VALUES ('Default Organization', 'Default organization for existing data') ON CONFLICT DO NOTHING;

-- Update existing data to use default organization
UPDATE users SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE categories SET organization_id = 1 WHERE organization_id IS NULL;  
UPDATE products SET organization_id = 1 WHERE organization_id IS NULL;