import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_phone: z.string().min(1, 'Phone number is required'),
  notes: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

const orderService = new OrderService();

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    console.log('getAllOrders called by user:', req.user?.id, 'role:', req.user?.role);
    
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      console.log('Access denied for role:', req.user?.role);
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { status, user_id, limit = 20, offset = 0 } = req.query;
    const orders = await orderService.getAllOrders({
      status: status as string,
      user_id: user_id ? parseInt(user_id as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    console.log('Orders found:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(
      parseInt(id), 
      req.user?.id, 
      req.user?.role
    );
    
    res.json(order);
  } catch (error) {
    console.error('Get order by id error:', error);
    if (error instanceof Error && error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else if (error instanceof Error && error.message === 'Forbidden') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    console.log('Creating order for user:', req.user?.id);
    console.log('Request body:', req.body);
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = CreateOrderSchema.parse(req.body);
    console.log('Validated data:', data);

    const order = await orderService.createOrder(req.user.id, data);

    console.log('Order created successfully');
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Order creation error:', error);
    if (error instanceof Error && error.message === 'Cart is empty') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    console.log('Update order status called:', req.params.id, req.body);
    
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateOrderStatusSchema.parse(req.body);

    // Validate status values
    const validStatuses = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PROCESSING'];
    if (!validStatuses.includes(data.status.toUpperCase())) {
      res.status(400).json({ error: 'Invalid status value', validStatuses });
      return;
    }

    const order = await orderService.updateOrderStatus(parseInt(id), data.status.toUpperCase());

    try {
      await logAuditAction(req.user?.id || null, 'ORDER_STATUS_UPDATED', 'ORDER', parseInt(id), { status: order?.status }, data, req.ip, req.userAgent);
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
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
    const order = await orderService.cancelOrder(
      parseInt(id), 
      req.user?.id, 
      req.user?.role
    );

    await logAuditAction(req.user?.id || null, 'ORDER_CANCELLED', 'ORDER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    if (error instanceof Error && error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else if (error instanceof Error && error.message === 'Forbidden') {
      res.status(403).json({ error: error.message });
    } else if (error instanceof Error && error.message === 'Cannot cancel order in current status') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { limit = 20, offset = 0 } = req.query;
    const orders = await orderService.getUserOrders(req.user.id, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json(orders);
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

    const stats = await orderService.getOrderStats();
    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
