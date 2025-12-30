import { pool } from '../config/db';
import { hashPassword } from '../utils/password';

export async function seedRoles() {
  try {
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrator with full system access' },
      { name: 'ADMIN', description: 'Administrator with access to products, inventory, and orders' },
      { name: 'USER', description: 'Regular user with access to browsing and ordering' },
    ];

    for (const role of roles) {
      await pool.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [role.name, role.description]
      );
    }

    console.log('✓ Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
}

export async function seedPermissions() {
  try {
    const permissions = [
      // User & Role Management
      { name: 'view_users', description: 'View all users', module: 'users' },
      { name: 'create_admin', description: 'Create admin accounts', module: 'users' },
      { name: 'update_user', description: 'Update user information', module: 'users' },
      { name: 'deactivate_user', description: 'Deactivate user accounts', module: 'users' },
      { name: 'lock_user', description: 'Lock user accounts', module: 'users' },
      { name: 'reset_password', description: 'Reset user passwords', module: 'users' },
      
      // Role & Permission Management
      { name: 'manage_roles', description: 'Create, update, delete roles', module: 'roles' },
      { name: 'manage_permissions', description: 'Create, update, delete permissions', module: 'roles' },
      { name: 'assign_roles', description: 'Assign roles to users', module: 'roles' },
      
      // Product Management
      { name: 'create_product', description: 'Create new products', module: 'products' },
      { name: 'update_product', description: 'Update product details', module: 'products' },
      { name: 'deactivate_product', description: 'Deactivate products', module: 'products' },
      { name: 'view_products', description: 'View product list', module: 'products' },
      
      // Category Management
      { name: 'create_category', description: 'Create product categories', module: 'categories' },
      { name: 'update_category', description: 'Update categories', module: 'categories' },
      { name: 'delete_category', description: 'Delete categories', module: 'categories' },
      
      // Inventory Management
      { name: 'view_inventory', description: 'View inventory levels', module: 'inventory' },
      { name: 'add_stock', description: 'Add stock to inventory', module: 'inventory' },
      { name: 'adjust_stock', description: 'Adjust inventory stock', module: 'inventory' },
      { name: 'set_thresholds', description: 'Set low stock thresholds', module: 'inventory' },
      
      // Order Management
      { name: 'view_orders', description: 'View all orders', module: 'orders' },
      { name: 'confirm_order', description: 'Confirm orders', module: 'orders' },
      { name: 'update_order_status', description: 'Update order status', module: 'orders' },
      { name: 'cancel_order', description: 'Cancel orders', module: 'orders' },
      
      // Supplier Management
      { name: 'manage_suppliers', description: 'Create and manage suppliers', module: 'suppliers' },
      { name: 'link_product_supplier', description: 'Link products to suppliers', module: 'suppliers' },
      
      // System Configuration
      { name: 'configure_system', description: 'Configure system settings', module: 'system' },
      { name: 'view_audit_logs', description: 'View audit logs', module: 'system' },
      { name: 'view_reports', description: 'View system reports', module: 'system' },
    ];

    for (const permission of permissions) {
      await pool.query(
        `INSERT INTO permissions (name, description, module) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [permission.name, permission.description, permission.module]
      );
    }

    console.log('✓ Permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
}

export async function seedRolePermissions() {
  try {
    // Get all role and permission IDs
    const rolesResult = await pool.query('SELECT id, name FROM roles');
    const permissionsResult = await pool.query('SELECT id, name FROM permissions');

    const roles = rolesResult.rows;
    const permissions = permissionsResult.rows;

    const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
    const adminRole = roles.find(r => r.name === 'ADMIN');
    const userRole = roles.find(r => r.name === 'USER');

    if (!superAdminRole || !adminRole || !userRole) {
      console.error('Roles not found');
      return;
    }

    // Super Admin gets all permissions
    for (const permission of permissions) {
      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [superAdminRole.id, permission.id]
      );
    }

    // Admin gets product, inventory, order, category permissions only
    const adminPermissions = [
      'create_product', 'update_product', 'deactivate_product', 'view_products',
      'create_category', 'update_category', 'delete_category',
      'view_inventory', 'add_stock', 'adjust_stock', 'set_thresholds',
      'view_orders', 'confirm_order', 'update_order_status', 'cancel_order'
    ];

    for (const permName of adminPermissions) {
      const perm = permissions.find(p => p.name === permName);
      if (perm) {
        await pool.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [adminRole.id, perm.id]
        );
      }
    }

    // User gets minimal permissions - no need as they only access their own data
    console.log('✓ Role permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding role permissions:', error);
  }
}

export async function seedWarehouse() {
  try {
    await pool.query(
      `INSERT INTO warehouses (name, location, is_active) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      ['Main Warehouse', 'Building A, Floor 1', true]
    );

    console.log('✓ Warehouses seeded successfully');
  } catch (error) {
    console.error('Error seeding warehouses:', error);
  }
}

export async function seedDefaultUsers() {
  try {
    // Create Super Admin
    const existingSuperAdmin = await pool.query(
      `SELECT id FROM users WHERE email = 'admin@inventory.local'`
    );

    if (existingSuperAdmin.rows.length === 0) {
      const superAdminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`);
      if (superAdminRoleResult.rows.length > 0) {
        const superAdminRoleId = superAdminRoleResult.rows[0].id;
        const password = await hashPassword('admin@123456');

        await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          ['admin@inventory.local', password, 'System', 'Administrator', superAdminRoleId]
        );
        console.log('✓ Super Admin created (Email: admin@inventory.local, Password: admin@123456)');
      }
    }

    // Create Admin User
    const existingAdmin = await pool.query(
      `SELECT id FROM users WHERE email = 'admin@test.com'`
    );

    if (existingAdmin.rows.length === 0) {
      const adminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'ADMIN'`);
      if (adminRoleResult.rows.length > 0) {
        const adminRoleId = adminRoleResult.rows[0].id;
        const password = await hashPassword('admin123');

        await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          ['admin@test.com', password, 'Admin', 'User', adminRoleId]
        );
        console.log('✓ Admin user created (Email: admin@test.com, Password: admin123)');
      }
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
}

export async function initializeDatabase() {
  try {
    console.log('Initializing database seeds...');
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedWarehouse();
    await seedDefaultUsers();
    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}
