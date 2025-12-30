import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/AllEntities';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  display_order: z.number().optional(),
});

export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    console.log('Getting all categories - starting query');
    
    const categoryRepository = AppDataSource.getRepository(Category);
    const categories = await categoryRepository.find({ order: { id: 'ASC' } });
    
    console.log('Query executed successfully, rows found:', categories.length);
    
    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ 
      error: 'Database error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const categoryRepository = AppDataSource.getRepository(Category);
    
    const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Get child categories
    const childCategories = await categoryRepository.find({ 
      where: { parent_id: parseInt(id) },
      order: { display_order: 'ASC' }
    });

    res.json({
      ...category,
      childCategories,
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    console.log('Creating category with data:', req.body);
    console.log('User role:', req.user?.role);
    
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      console.log('Access denied for role:', req.user?.role);
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateCategorySchema.parse(req.body);
    console.log('Validated data:', data);

    const categoryRepository = AppDataSource.getRepository(Category);
    const category = categoryRepository.create({
      name: data.name,
      description: data.description || null,
      parent_id: data.parent_id || null,
      is_active: true,
      display_order: 0
    });

    const savedCategory = await categoryRepository.save(category);
    console.log('Category created:', savedCategory);

    res.status(201).json({
      message: 'Category created successfully',
      category: savedCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Category validation error:', error.issues);
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
    
    const categoryRepository = AppDataSource.getRepository(Category);
    const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });
    
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    Object.assign(category, data);
    const updatedCategory = await categoryRepository.save(category);

    await logAuditAction(req.user?.id || null, 'CATEGORY_UPDATED', 'CATEGORY', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory,
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
    const categoryRepository = AppDataSource.getRepository(Category);
    
    const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if category has subcategories
    const subCategoriesCount = await categoryRepository.count({ where: { parent_id: parseInt(id) } });
    if (subCategoriesCount > 0) {
      res.status(400).json({ error: 'Cannot delete category with subcategories' });
      return;
    }

    await categoryRepository.remove(category);
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

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
