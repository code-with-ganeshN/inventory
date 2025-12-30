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

    // Get low stock products count (stock <= low_stock_threshold)
    const lowStockProducts = await productRepository
      .createQueryBuilder('product')
      .where('product.is_active = :active', { active: true })
      .andWhere('product.stock <= product.low_stock_threshold')
      .getCount();

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