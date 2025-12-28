import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreatePermissionSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  module: z.string(),
});

const UpdatePermissionSchema = z.object({
  description: z.string().optional(),
});

export async function getAllPermissions(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { module } = req.query;
    let query = 'SELECT * FROM permissions';
    const params: any[] = [];

    if (module) {
      query += ' WHERE module = $1';
      params.push(module);
    }

    query += ' ORDER BY module, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPermissionsByRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { roleId } = req.params;

    const result = await pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.module, p.name`,
      [roleId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get permissions by role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createPermission(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreatePermissionSchema.parse(req.body);

    const result = await pool.query(
      'INSERT INTO permissions (name, description, module) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.description, data.module]
    );

    await logAuditAction(req.user.id, 'PERMISSION_CREATED', 'PERMISSION', result.rows[0].id, null, { name: data.name }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Permission created successfully',
      permission: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create permission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updatePermission(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdatePermissionSchema.parse(req.body);

    const result = await pool.query(
      'UPDATE permissions SET description = COALESCE($1, description) WHERE id = $2 RETURNING *',
      [data.description, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Permission not found' });
      return;
    }

    await logAuditAction(req.user.id, 'PERMISSION_UPDATED', 'PERMISSION', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Permission updated successfully',
      permission: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update permission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deletePermission(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query('DELETE FROM permissions WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Permission not found' });
      return;
    }

    await logAuditAction(req.user.id, 'PERMISSION_DELETED', 'PERMISSION', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
