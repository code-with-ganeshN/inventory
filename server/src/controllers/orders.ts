import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  delivery_address: z.string(),
  delivery_phone: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { status, user_id, limit = 20, offset = 0 } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    let query = `
      SELECT o.*, u.email as user_email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;

    if (status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }

    if (user_id) {
      conditions.push(`o.user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user?.role === 'USER') {
      const userOrderCheck = await pool.query('SELECT user_id FROM orders WHERE id = $1', [id]);
      if (userOrderCheck.rows.length === 0 || userOrderCheck.rows[0].user_id !== req.user.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const orderResult = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'USER') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateOrderSchema.parse(req.body);

    // Get user's cart
    const cartResult = await pool.query(
      `SELECT sc.*, p.price
       FROM shopping_carts sc
       JOIN products p ON sc.product_id = p.id
       WHERE sc.user_id = $1 AND sc.saved_for_later = false`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cartResult.rows) {
      subtotal += item.price * item.quantity;
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, order_number, subtotal, tax, total, delivery_address, delivery_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, orderNumber, subtotal, tax, total, data.delivery_address, data.delivery_phone, data.notes]
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const cartItem of cartResult.rows) {
      const itemSubtotal = cartItem.price * cartItem.quantity;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, cartItem.product_id, cartItem.quantity, cartItem.price, itemSubtotal]
      );

      // Reduce inventory
      await pool.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [cartItem.quantity, cartItem.product_id]
      );
    }

    // Clear cart
    await pool.query('DELETE FROM shopping_carts WHERE user_id = $1 AND saved_for_later = false', [req.user.id]);

    await logAuditAction(req.user.id, 'ORDER_CREATED', 'ORDER', orderId, null, { orderNumber }, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Order created successfully',
      order: orderResult.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateOrderStatusSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [data.status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'ORDER_STATUS_UPDATED', 'ORDER', parseInt(id), { status: result.rows[0].status }, data, req.ip, req.userAgent);

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const orderResult = await pool.query('SELECT user_id, status FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Authorization check
    if (req.user?.role === 'USER' && orderResult.rows[0].user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (req.user?.role !== 'USER' && !['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Can't cancel if already delivered or cancelled
    if (['DELIVERED', 'CANCELLED'].includes(orderResult.rows[0].status)) {
      res.status(400).json({ error: 'Cannot cancel order in current status' });
      return;
    }

    // Restore inventory
    const itemsResult = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
    for (const item of itemsResult.rows) {
      await pool.query(
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['CANCELLED', id]
    );

    await logAuditAction(req.user?.id || null, 'ORDER_CANCELLED', 'ORDER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({
      message: 'Order cancelled successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrderStats(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
        SUM(total) as total_revenue,
        AVG(total) as average_order_value
      FROM orders
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
