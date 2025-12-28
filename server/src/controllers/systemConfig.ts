import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const SystemConfigSchema = z.object({
  currency: z.string().optional(),
  tax_rate: z.number().optional(),
  unit_of_measurement: z.string().optional(),
  order_limit: z.number().optional(),
  low_stock_threshold: z.number().optional(),
  warehouse_name: z.string().optional(),
  password_min_length: z.number().optional(),
  password_require_special: z.boolean().optional(),
});

export async function getSystemConfig(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT key, value, description FROM system_config ORDER BY key');
    
    const config: any = {};
    for (const row of result.rows) {
      config[row.key] = row.value;
    }

    res.json(config);
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSystemConfig(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = SystemConfigSchema.parse(req.body);

    const configMap = new Map([
      ['currency', data.currency],
      ['tax_rate', data.tax_rate?.toString()],
      ['unit_of_measurement', data.unit_of_measurement],
      ['order_limit', data.order_limit?.toString()],
      ['low_stock_threshold', data.low_stock_threshold?.toString()],
      ['warehouse_name', data.warehouse_name],
      ['password_min_length', data.password_min_length?.toString()],
      ['password_require_special', data.password_require_special?.toString()],
    ]);

    for (const [key, value] of configMap) {
      if (value !== undefined && value !== 'undefined') {
        await pool.query(
          `INSERT INTO system_config (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
    }

    await logAuditAction(req.user.id, 'SYSTEM_CONFIG_UPDATED', 'SYSTEM_CONFIG', null, null, data, req.ip, req.userAgent);

    res.json({
      message: 'System configuration updated successfully',
      config: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update system config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function getConfigValue(req: Request, res: Response): Promise<void> {
  try {
    const { key } = req.params;

    const result = await pool.query('SELECT value FROM system_config WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Configuration key not found' });
      return;
    }

    res.json({ key, value: result.rows[0].value });
  } catch (error) {
    console.error('Get config value error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function setConfigValue(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { key } = req.params;
    const { value, description } = req.body;

    const result = await pool.query(
      `INSERT INTO system_config (key, value, description) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, description]
    );

    await logAuditAction(req.user.id, 'CONFIG_VALUE_SET', 'SYSTEM_CONFIG', null, null, { key, value }, req.ip, req.userAgent);

    res.json({
      message: 'Configuration value set successfully',
      config: result.rows[0],
    });
  } catch (error) {
    console.error('Set config value error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
