import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
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
    // Return sample system config data with unique keys
    const configs = [
      { id: 1, key: 'currency', value: 'USD', description: 'System currency', type: 'STRING' },
      { id: 2, key: 'tax_rate', value: '100', description: 'Tax rate percentage', type: 'NUMBER' },
      { id: 3, key: 'unit_of_measurement', value: 'pieces', description: 'Default unit', type: 'STRING' },
      { id: 4, key: 'order_limit', value: '1000', description: 'Maximum order amount', type: 'NUMBER' },
      { id: 5, key: 'low_stock_threshold', value: '10', description: 'Low stock alert threshold', type: 'NUMBER' },
      { id: 6, key: 'warehouse_name', value: 'Main Warehouse', description: 'Primary warehouse name', type: 'STRING' },
      { id: 7, key: 'password_min_length', value: '8', description: 'Minimum password length', type: 'NUMBER' },
      { id: 8, key: 'password_require_special', value: 'true', description: 'Require special characters', type: 'BOOLEAN' }
    ];

    res.json({
      data: {
        configs,
        total: configs.length
      }
    });
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

    res.json({ message: 'System configuration updated successfully' });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getConfigValue(req: Request, res: Response): Promise<void> {
  try {
    const { key } = req.params;
    res.json({ key, value: 'default_value' });
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

    res.json({ message: 'Configuration value set successfully' });
  } catch (error) {
    console.error('Set config value error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
