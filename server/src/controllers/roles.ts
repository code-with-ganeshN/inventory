import { Request, Response } from 'express';
import { pool } from '../config/db';
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

    const result = await pool.query('SELECT * FROM roles ORDER BY name');
    res.json({
      data: {
        roles: result.rows,
        total: result.rows.length
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

    const roleResult = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleResult.rows.length === 0) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    const permissionsResult = await pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.module, p.name`,
      [id]
    );

    res.json({
      ...roleResult.rows[0],
      permissions: permissionsResult.rows,
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

    const data = CreateRoleSchema.parse(req.body);

    const result = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description]
    );

    const roleId = result.rows[0].id;

    // Assign permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      for (const permissionId of data.permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, permissionId]
        );
      }
    }

    await logAuditAction(req.user.id, 'ROLE_CREATED', 'ROLE', roleId, null, { name: data.name }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Role created successfully',
      role: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateRoleSchema.parse(req.body);

    const result = await pool.query(
      'UPDATE roles SET description = COALESCE($1, description), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [data.description, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Update permissions if provided
    if (data.permissions) {
      // Remove existing permissions
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

      // Add new permissions
      for (const permissionId of data.permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [id, permissionId]
        );
      }
    }

    await logAuditAction(req.user.id, 'ROLE_UPDATED', 'ROLE', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Role updated successfully',
      role: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Check if role is in use
    const usageResult = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(usageResult.rows[0].count) > 0) {
      res.status(400).json({ error: 'Cannot delete role that is in use' });
      return;
    }

    const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    await logAuditAction(req.user.id, 'ROLE_DELETED', 'ROLE', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
