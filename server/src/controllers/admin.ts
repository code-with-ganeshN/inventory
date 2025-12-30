import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/AllEntities';

export async function getAdminDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const productRepository = AppDataSource.getRepository(Product);

    // Get total products count
    const totalProducts = await productRepository.count();

    // Get active products count
    const activeProducts = await productRepository.count({
      where: { is_active: true }
    });

    // Get inactive products count
    const inactiveProducts = await productRepository.count({
      where: { is_active: false }
    });

    // For now, set low stock products to 0 since inventory system isn't implemented
    const lowStockProducts = 0;

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