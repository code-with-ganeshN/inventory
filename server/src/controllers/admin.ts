import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function getAdminDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    let totalProducts = 0;
    let activeProducts = 0;
    let inactiveProducts = 0;
    let lowStockProducts = 0;

    try {
      // Get product stats
      const productStats = await pool.query(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products
        FROM products
      `);
      
      totalProducts = parseInt(productStats.rows[0].total_products) || 0;
      activeProducts = parseInt(productStats.rows[0].active_products) || 0;
      inactiveProducts = parseInt(productStats.rows[0].inactive_products) || 0;
    } catch (productError) {
      console.log('Products table query failed:', productError.message);
    }

    try {
      // Get low stock products
      const lowStockStats = await pool.query(`
        SELECT COUNT(*) as low_stock_products
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.quantity_on_hand <= i.low_stock_threshold AND p.is_active = true
      `);
      
      lowStockProducts = parseInt(lowStockStats.rows[0].low_stock_products) || 0;
    } catch (inventoryError) {
      console.log('Inventory table query failed:', inventoryError.message);
    }

    res.json({
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}