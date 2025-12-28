import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string(),
  sku: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  category_id: z.number(),
  image_url: z.string().optional(),
});

const UpdateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category_id: z.number().optional(),
  image_url: z.string().optional(),
});

export async function getAllProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category_id, active, limit = 20, offset = 0 } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    if (category_id) {
      conditions.push(`p.category_id = $${params.length + 1}`);
      params.push(category_id);
    }

    if (active === 'true') {
      conditions.push('p.is_active = true');
    } else if (active === 'false') {
      conditions.push('p.is_active = false');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateProductSchema.parse(req.body);

    // Check if SKU already exists
    const existingSKU = await pool.query('SELECT id FROM products WHERE sku = $1', [data.sku]);
    if (existingSKU.rows.length > 0) {
      res.status(400).json({ error: 'SKU already exists' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO products (name, sku, description, price, category_id, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, data.sku, data.description, data.price, data.category_id, data.image_url, req.user?.id]
    );

    await logAuditAction(req.user?.id || null, 'PRODUCT_CREATED', 'PRODUCT', result.rows[0].id, null, data, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateProductSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category_id = COALESCE($4, category_id),
           image_url = COALESCE($5, image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [data.name, data.description, data.price, data.category_id, data.image_url, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'PRODUCT_UPDATED', 'PRODUCT', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deactivateProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'PRODUCT_DEACTIVATED', 'PRODUCT', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Product deactivated successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Deactivate product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function activateProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE products SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'PRODUCT_ACTIVATED', 'PRODUCT', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Product activated successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Activate product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchProducts(req: Request, res: Response): Promise<void> {
  try {
    const { query, category_id, limit = 20, offset = 0 } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;

    if (query) {
      conditions.push(`(p.name ILIKE $${params.length + 1} OR p.sku ILIKE $${params.length + 1})`);
      params.push(`%${query}%`);
    }

    if (category_id) {
      conditions.push(`p.category_id = $${params.length + 1}`);
      params.push(category_id);
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY p.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
