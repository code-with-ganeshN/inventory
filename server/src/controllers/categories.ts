import { Request, Response } from 'express';
import { pool } from '../config/db';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parent_id: z.number().optional(),
});

const UpdateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.number().optional(),
  display_order: z.number().optional(),
});

export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    const { active, parent_id } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    let query = 'SELECT * FROM categories';

    if (active === 'true') {
      conditions.push('is_active = true');
    }

    if (parent_id) {
      conditions.push(`parent_id = $${params.length + 1}`);
      params.push(parent_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY display_order, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Get child categories
    const childCategories = await pool.query('SELECT * FROM categories WHERE parent_id = $1 ORDER BY display_order', [id]);

    res.json({
      ...result.rows[0],
      childCategories: childCategories.rows,
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateCategorySchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO categories (name, description, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.description, data.parent_id || null]
    );

    await logAuditAction(req.user?.id || null, 'CATEGORY_CREATED', 'CATEGORY', result.rows[0].id, null, data, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateCategorySchema.parse(req.body);

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           parent_id = COALESCE($3, parent_id),
           display_order = COALESCE($4, display_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [data.name, data.description, data.parent_id, data.display_order, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'CATEGORY_UPDATED', 'CATEGORY', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Check if category has products
    const productsCheck = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(productsCheck.rows[0].count) > 0) {
      res.status(400).json({ error: 'Cannot delete category with products' });
      return;
    }

    // Check if category has subcategories
    const subCategoriesCheck = await pool.query('SELECT COUNT(*) FROM categories WHERE parent_id = $1', [id]);
    if (parseInt(subCategoriesCheck.rows[0].count) > 0) {
      res.status(400).json({ error: 'Cannot delete category with subcategories' });
      return;
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'CATEGORY_DELETED', 'CATEGORY', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderCategories(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const ReorderSchema = z.object({
      categories: z.array(
        z.object({
          id: z.number(),
          display_order: z.number(),
        })
      ),
    });

    const data = ReorderSchema.parse(req.body);

    for (const cat of data.categories) {
      await pool.query('UPDATE categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [cat.display_order, cat.id]);
    }

    await logAuditAction(req.user?.id || null, 'CATEGORIES_REORDERED', 'CATEGORY', null, null, data, req.ip, req.userAgent);

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Reorder categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
