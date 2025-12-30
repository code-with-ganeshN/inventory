import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/AllEntities';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateRoleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  permissions: z.array(z.number()).optional(),
});

const UpdateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.number()).optional(),
});

export async function getAllRoles(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const roleRepository = AppDataSource.getRepository(Role);
    const roles = await roleRepository.find({ order: { name: 'ASC' } });
    
    res.json({
      data: {
        roles,
        total: roles.length
      }
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRoleWithPermissions(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    const role = await roleRepository.findOne({ where: { id: parseInt(id) } });
    
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json({
      ...role,
      permissions: [], // Empty permissions until permission system is implemented
    });
  } catch (error) {
    console.error('Get role with permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ message: 'Role management not implemented yet' });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ message: 'Role management not implemented yet' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ message: 'Role management not implemented yet' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
