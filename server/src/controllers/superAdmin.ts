import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, Role, ShoppingCart } from '../entities/AllEntities';
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

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    
    const queryBuilder = userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .select([
        'u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.phone', 
        'u.role_id', 'u.is_active', 'u.is_locked', 'u.created_at',
        'r.name'
      ]);

    if (role) {
      queryBuilder.andWhere('r.name = :role', { role });
    }

    if (status === 'active') {
      queryBuilder.andWhere('u.is_active = true');
    } else if (status === 'inactive') {
      queryBuilder.andWhere('u.is_active = false');
    } else if (status === 'locked') {
      queryBuilder.andWhere('u.is_locked = true');
    }

    const [users, total] = await queryBuilder
      .orderBy('u.created_at', 'DESC')
      .limit(limitNum)
      .offset(offset)
      .getManyAndCount();
    
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.role?.name,
      status: user.is_active ? 'ACTIVE' : user.is_locked ? 'LOCKED' : 'INACTIVE',
      created_at: user.created_at
    }));

    res.json({
      data: {
        users: transformedUsers,
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

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const existingUser = await userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(data.password);

    const adminRole = await roleRepository.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      res.status(400).json({ error: 'ADMIN role not found' });
      return;
    }

    const user = userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role_id: adminRole.id,
      is_active: true
    });

    const savedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'ADMIN_ACCOUNT_CREATED', 'USER', savedUser.id, null, { email: data.email }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        phone: savedUser.phone,
        role_id: savedUser.role_id,
        status: savedUser.is_active ? 'ACTIVE' : 'INACTIVE',
        created_at: savedUser.created_at
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

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    Object.assign(user, data);
    const updatedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'USER_UPDATED', 'USER', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
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

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.is_active = false;
    const updatedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'USER_DEACTIVATED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User deactivated successfully', user: updatedUser });
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

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.is_active = true;
    user.is_locked = false;
    const updatedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'USER_ACTIVATED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User activated successfully', user: updatedUser });
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

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.is_locked = true;
    const updatedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'USER_LOCKED', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'User locked successfully', user: updatedUser });
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

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.password_hash = passwordHash;
    const updatedUser = await userRepository.save(user);

    await logAuditAction(req.user.id, 'PASSWORD_RESET', 'USER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({
      message: 'Password reset successfully',
      newPassword,
      user: { id: updatedUser.id, email: updatedUser.email },
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

    // Login history functionality would need a separate LoginHistory entity
    // For now, return empty array
    res.json([]);
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

    const userRepository = AppDataSource.getRepository(User);
    const cartRepository = AppDataSource.getRepository(ShoppingCart);

    // Check if user has items in cart
    const cartItemCount = await cartRepository.count({ where: { user_id: parseInt(id) } });
    
    if (cartItemCount > 0) {
      res.status(400).json({ error: 'This account cannot be deleted because there are items in the cart.' });
      return;
    }

    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Check if trying to delete the current user
    if (req.user?.id === parseInt(id)) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    const deletedUser = { ...user };
    await userRepository.remove(user);

    await logAuditAction(req.user.id, 'USER_DELETED', 'USER', parseInt(id), null, { email: deletedUser.email }, req.ip, req.userAgent);

    res.json({
      message: 'User deleted successfully',
      user: {
        id: deletedUser.id,
        email: deletedUser.email,
        first_name: deletedUser.first_name,
        last_name: deletedUser.last_name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
