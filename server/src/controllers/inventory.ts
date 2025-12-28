import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const AddStockSchema = z.object({
  warehouse_id: z.number(),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

const AdjustStockSchema = z.object({
  warehouse_id: z.number(),
  quantity: z.number(),
  notes: z.string().optional(),
});

const SetLowStockThresholdSchema = z.object({
  warehouse_id: z.number(),
  threshold: z.number().nonnegative(),
});

export async function getInventoryByProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, p.name as product_name, p.sku, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.product_id = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory by product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInventoryByWarehouse(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { warehouseId } = req.params;
    const { low_stock, limit = 50, offset = 0 } = req.query;
    const params: any[] = [warehouseId];
    const conditions = ['i.warehouse_id = $1'];

    if (low_stock === 'true') {
      conditions.push('i.quantity_on_hand <= i.low_stock_threshold');
    }

    let query = `
      SELECT i.*, p.name as product_name, p.sku, p.price, w.name as warehouse_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory by warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addStock(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { productId } = req.params;
    const data = AddStockSchema.parse(req.body);

    // Check if inventory record exists
    const inventoryCheck = await pool.query(
      'SELECT id FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
      [productId, data.warehouse_id]
    );

    let inventoryId;
    if (inventoryCheck.rows.length === 0) {
      // Create new inventory record
      const createResult = await pool.query(
        `INSERT INTO inventory (product_id, warehouse_id, quantity_on_hand)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [productId, data.warehouse_id, data.quantity]
      );
      inventoryId = createResult.rows[0].id;
    } else {
      // Update existing inventory
      inventoryId = inventoryCheck.rows[0].id;
      await pool.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [data.quantity, inventoryId]
      );
    }

    // Log inventory movement
    await pool.query(
      `INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, quantity, reference_type, notes, created_by)
       VALUES ($1, $2, 'RECEIVED', $3, 'GOODS_RECEIVED', $4, $5)`,
      [productId, data.warehouse_id, data.quantity, data.notes, req.user?.id]
    );

    await logAuditAction(req.user?.id || null, 'STOCK_ADDED', 'INVENTORY', inventoryId, null, data, req.ip, req.userAgent);

    res.json({ message: 'Stock added successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Add stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { productId } = req.params;
    const data = AdjustStockSchema.parse(req.body);

    const inventoryResult = await pool.query(
      'SELECT id, quantity_on_hand FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
      [productId, data.warehouse_id]
    );

    if (inventoryResult.rows.length === 0) {
      res.status(404).json({ error: 'Inventory not found' });
      return;
    }

    const oldQuantity = inventoryResult.rows[0].quantity_on_hand;
    const newQuantity = Math.max(0, oldQuantity + data.quantity);
    const movementType = data.quantity > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUBTRACT';

    await pool.query(
      'UPDATE inventory SET quantity_on_hand = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3',
      [newQuantity, productId, data.warehouse_id]
    );

    // Log inventory movement
    await pool.query(
      `INSERT INTO inventory_movements (product_id, warehouse_id, movement_type, quantity, reference_type, notes, created_by)
       VALUES ($1, $2, $3, $4, 'ADJUSTMENT', $5, $6)`,
      [productId, data.warehouse_id, movementType, Math.abs(data.quantity), data.notes, req.user?.id]
    );

    await logAuditAction(req.user?.id || null, 'STOCK_ADJUSTED', 'INVENTORY', inventoryResult.rows[0].id, { quantity: oldQuantity }, { quantity: newQuantity }, req.ip, req.userAgent);

    res.json({ message: 'Stock adjusted successfully', oldQuantity, newQuantity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Adjust stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function setLowStockThreshold(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { productId } = req.params;
    const data = SetLowStockThresholdSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE inventory
       SET low_stock_threshold = $1, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [data.threshold, productId, data.warehouse_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inventory not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'LOW_STOCK_THRESHOLD_SET', 'INVENTORY', result.rows[0].id, null, data, req.ip, req.userAgent);

    res.json({ message: 'Low stock threshold updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Set low stock threshold error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function getInventoryMovements(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { productId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT im.*, p.name as product_name, u.email as created_by_email
       FROM inventory_movements im
       JOIN products p ON im.product_id = p.id
       LEFT JOIN users u ON im.created_by = u.id
       WHERE im.product_id = $1
       ORDER BY im.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLowStockProducts(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { warehouseId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT i.*, p.name as product_name, p.sku, p.price, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.warehouse_id = $1 AND i.quantity_on_hand <= i.low_stock_threshold
       ORDER BY i.quantity_on_hand ASC
       LIMIT $2 OFFSET $3`,
      [warehouseId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInventoryStats(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_products,
        SUM(i.quantity_on_hand) as total_quantity,
        COUNT(CASE WHEN i.quantity_on_hand <= i.low_stock_threshold THEN 1 END) as low_stock_count,
        SUM(CASE WHEN i.quantity_on_hand = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = true
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
