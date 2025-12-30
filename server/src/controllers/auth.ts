import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { logAuditAction } from '../utils/audit';
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

const authService = new AuthService();

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = RegisterSchema.parse(req.body);
    const result = await authService.register(data);
    
    await logAuditAction(result.user.id, 'USER_REGISTERED', 'USER', result.user.id, null, { email: data.email }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'User registered successfully',
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        phone: result.user.phone,
        address: result.user.address,
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
    const result = await authService.login(data.email, data.password);

    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Please enter a valid email and password.' });
    } else {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('No account found')) {
        res.status(401).json({ error: message });
      } else if (message.includes('Incorrect password')) {
        res.status(401).json({ error: message });
      } else if (message.includes('Account is locked')) {
        res.status(403).json({ error: message });
      } else if (message.includes('Account is inactive')) {
        res.status(403).json({ error: message });
      } else {
        res.status(500).json({ error: 'Internal server error from backend' });
      }
    }
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { generateToken } = await import('../utils/jwt');
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

    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
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
    const user = await authService.updateProfile(req.user.id, data);

    await logAuditAction(req.user.id, 'PROFILE_UPDATED', 'USER', req.user.id, null, data, req.ip, req.userAgent);

    res.json({
      message: 'Profile updated successfully',
      user,
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
    await authService.changePassword(req.user.id, data.old_password, data.new_password);

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
