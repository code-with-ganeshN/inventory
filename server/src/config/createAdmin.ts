import { pool } from '../config/db';
import { hashPassword } from '../utils/password';

export async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await pool.query(
      `SELECT id FROM users WHERE email = 'admin@test.com'`
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Get ADMIN role
    const roleResult = await pool.query(`SELECT id FROM roles WHERE name = 'ADMIN'`);
    if (roleResult.rows.length === 0) {
      console.error('ADMIN role not found');
      return;
    }

    const adminRoleId = roleResult.rows[0].id;
    const password = await hashPassword('admin123');

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [
        'admin@test.com',
        password,
        'Admin',
        'User',
        adminRoleId
      ]
    );

    console.log('✓ Admin user created (Email: admin@test.com, Password: admin123)');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser().then(() => process.exit(0));
}