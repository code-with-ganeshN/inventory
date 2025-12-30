import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  category_id: z.number().positive('Category ID is required'),
  image_url: z.string().optional().nullable(),
  stock: z.number().min(0).optional(),
  low_stock_threshold: z.number().min(0).optional(),
});

const UpdateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category_id: z.number().optional(),
  image_url: z.string().optional(),
});

const productService = new ProductService();

export async function getAllProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category_id, active, query, limit = 20, offset = 0 } = req.query;
    
    // If there's a search query, use the search method
    if (query) {
      const products = await productService.searchProducts({
        query: query as string,
        category_id: category_id ? parseInt(category_id as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(products);
      return;
    }
    
    const products = await productService.getAllProducts({
      category_id: category_id ? parseInt(category_id as string) : undefined,
      active: active as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(parseInt(id));
    res.json(product);
  } catch (error) {
    console.error('Get product by id error:', error);
    if (error instanceof Error && error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateProductSchema.parse(req.body);
    const productData = {
      name: data.name,
      sku: data.sku,
      description: data.description || undefined,
      price: data.price,
      category_id: data.category_id,
      image_url: data.image_url || undefined,
      stock: data.stock,
      low_stock_threshold: data.low_stock_threshold,
    };
    const product = await productService.createProduct(productData);

    await logAuditAction(
      req.user?.id || null, 
      'PRODUCT_CREATED', 
      'PRODUCT', 
      product.id, 
      null, 
      data, 
      req.ip || null, 
      req.get('user-agent') || null
    );

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Product validation error:', error.issues);
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else if (error instanceof Error && error.message === 'SKU already exists') {
      res.status(400).json({ error: error.message });
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
    const product = await productService.updateProduct(parseInt(id), data);

    await logAuditAction(req.user?.id || null, 'PRODUCT_UPDATED', 'PRODUCT', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else if (error instanceof Error && error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
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
    const product = await productService.deactivateProduct(parseInt(id));

    await logAuditAction(req.user?.id || null, 'PRODUCT_DEACTIVATED', 'PRODUCT', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Product deactivated successfully', product });
  } catch (error) {
    console.error('Deactivate product error:', error);
    if (error instanceof Error && error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function activateProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const product = await productService.activateProduct(parseInt(id));

    await logAuditAction(req.user?.id || null, 'PRODUCT_ACTIVATED', 'PRODUCT', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Product activated successfully', product });
  } catch (error) {
    console.error('Activate product error:', error);
    if (error instanceof Error && error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const result = await productService.deleteProduct(parseInt(id));

    await logAuditAction(req.user?.id || null, 'PRODUCT_DELETED', 'PRODUCT', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json(result);
  } catch (error) {
    console.error('Delete product error:', error);
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('must be deactivated') || error.message.includes('Cannot delete')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function searchProducts(req: Request, res: Response): Promise<void> {
  try {
    const { query, category_id, limit = 20, offset = 0 } = req.query;
    
    const products = await productService.searchProducts({
      query: query as string,
      category_id: category_id ? parseInt(category_id as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
