import { Request, Response } from 'express';
import { pool } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { logAuditAction, logLoginHistory } from '../utils/audit';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').regex(/^[^\s@]+@gmail\.com$/, 'Please use a Gmail address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  first_name: z.string().min(2, 'First name must be at least 2 characters').regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  last_name: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = RegisterSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await hashPassword(data.password);
    // Default to USER role (id: 3)
    const roleId = 3;

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, address, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, address, role_id, is_active, created_at`,
      [data.email, passwordHash, data.first_name, data.last_name, data.phone, data.address, roleId]
    );

    const user = result.rows[0];

    // Get role name
    const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [roleId]);
    const roleName = roleResult.rows[0]?.name || 'USER';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: roleName,
    });

    await logAuditAction(user.id, 'USER_REGISTERED', 'USER', user.id, null, { email: user.email }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ') });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data = LoginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, role_id, is_active, is_locked
       FROM users WHERE email = $1`,
      [data.email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'No account found with this email address.' });
      return;
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.is_locked) {
      res.status(403).json({ error: 'Account is locked' });
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    // Get role name
    const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
    const roleName = roleResult.rows[0]?.name || 'USER';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: roleName,
    });

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Log login history
    await logLoginHistory(user.id, (req as any).clientIp, (req as any).userAgent);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: roleName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Please enter a valid email and password.' });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error from backend' });
    }
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, address, role_id, is_active, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get role name
    const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [result.rows[0].role_id]);
    const roleName = roleResult.rows[0]?.name || 'USER';

    res.json({
      ...result.rows[0],
      role: roleName
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const UpdateProfileSchema = z.object({
      first_name: z.string().min(2, 'First name must be at least 2 characters').regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces').optional(),
      last_name: z.string().regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces').optional(),
      phone: z.string().regex(/^\d+$/, 'Phone number can only contain digits').min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits').optional().or(z.literal('')),
      address: z.string().min(30, 'Address must be at least 30 characters').max(255, 'Address cannot exceed 255 characters').optional().or(z.literal('')),
    });

    const data = UpdateProfileSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, address, role_id, is_active`,
      [data.first_name, data.last_name, data.phone, data.address, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAuditAction(req.user.id, 'PROFILE_UPDATED', 'USER', req.user.id, null, data, req.ip, req.userAgent);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ') });
    } else {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ChangePasswordSchema = z.object({
      old_password: z.string(),
      new_password: z.string().min(8),
    });

    const data = ChangePasswordSchema.parse(req.body);

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await comparePassword(data.old_password, userResult.rows[0].password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid old password' });
      return;
    }

    const newPasswordHash = await hashPassword(data.new_password);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, req.user.id]);

    await logAuditAction(req.user.id, 'PASSWORD_CHANGED', 'USER', req.user.id, null, {}, req.ip, req.userAgent);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
