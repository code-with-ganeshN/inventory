import { Request, Response } from 'express';
import { pool } from '../config/db';
import { hashPassword, generateRandomPassword } from '../utils/password';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const UpdateAdminSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { role, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 10);
    const offset = (pageNum - 1) * limitNum;

    let countQuery = `SELECT COUNT(*) as total FROM users u LEFT JOIN roles r ON u.role_id = r.id`;
    let dataQuery = `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id, u.is_active, u.is_locked, u.created_at, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id`;
    
    const params: any[] = [];
    const conditions: string[] = [];

    if (role) {
      conditions.push(`r.name = $${params.length + 1}`);
      params.push(role);
    }

    if (status === 'active') {
      conditions.push(`u.is_active = true`);
    } else if (status === 'inactive') {
      conditions.push(`u.is_active = false`);
    } else if (status === 'locked') {
      conditions.push(`u.is_locked = true`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    dataQuery += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(dataQuery, params);
    
    // Transform users to match frontend expectations
    const users = result.rows.map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.role_name,
      status: user.is_active ? 'ACTIVE' : user.is_locked ? 'LOCKED' : 'INACTIVE',
      created_at: user.created_at
    }));

    res.json({
      data: {
        users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAdminAccount(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateAdminSchema.parse(req.body);

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(data.password);

    // Get ADMIN role id (assuming it's 2)
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'ADMIN'");
    if (roleResult.rows.length === 0) {
      res.status(400).json({ error: 'ADMIN role not found' });
      return;
    }

    const adminRoleId = roleResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, first_name, last_name, phone, role_id, is_active, created_at`,
      [data.email, passwordHash, data.first_name, data.last_name, data.phone, adminRoleId]
    );

    const user = result.rows[0];

    await logAuditAction(req.user.id, 'ADMIN_ACCOUNT_CREATED', 'USER', user.id, null, { email: data.email }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role_id: user.role_id,
        status: user.is_active ? 'ACTIVE' : 'INACTIVE',
        created_at: user.created_at
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create admin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateAdminSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, address, role_id, is_active`,
      [data.first_name, data.last_name, data.phone, data.address, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'USER_UPDATED', 'USER', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deactivateUser(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Prevent modifying own account
    if (req.user?.id === parseInt(id)) {
      res.status(400).json({ error: 'You cannot modify your own account' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'USER_DEACTIVATED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User deactivated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function activateUser(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Prevent modifying own account
    if (req.user?.id === parseInt(id)) {
      res.status(400).json({ error: 'You cannot modify your own account' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET is_active = true, is_locked = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'USER_ACTIVATED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User activated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function lockUser(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_locked = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'USER_LOCKED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User locked successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Lock user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const newPassword = generateRandomPassword();
    const passwordHash = await hashPassword(newPassword);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email',
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'PASSWORD_RESET', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({
      message: 'Password reset successfully',
      newPassword,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserLoginHistory(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, user_id, login_time, logout_time, ip_address, user_agent
       FROM login_history
       WHERE user_id = $1
       ORDER BY login_time DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Prevent deleting the Super Admin user itself
    const userResult = await pool.query('SELECT role_id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    
    // Check if trying to delete the current user
    if (req.user?.id === parseInt(id)) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    // Check if user has items in cart
    const cartCheck = await pool.query('SELECT COUNT(*) as cart_count FROM shopping_carts WHERE user_id = $1', [id]);
    const cartItemCount = parseInt(cartCheck.rows[0].cart_count);
    
    if (cartItemCount > 0) {
      res.status(400).json({ error: 'This account cannot be deleted because there are items in the cart.' });
      return;
    }

    // Delete user
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, first_name, last_name',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'USER_DELETED', 'USER', parseInt(id), null, { email: result.rows[0].email }, req.ip, req.userAgent);

    res.json({
      message: 'User deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
