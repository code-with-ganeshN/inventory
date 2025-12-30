import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { logAuditAction } from '../utils/audit';
import { z } from 'zod';

const CreateSupplierSchema = z.object({
  name: z.string(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const UpdateSupplierSchema = z.object({
  name: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const LinkProductSchema = z.object({
  supplier_sku: z.string().optional(),
  lead_time_days: z.number().optional(),
  min_order_quantity: z.number().optional(),
  unit_price: z.number().optional(),
});

export async function getAllSuppliers(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { active, limit = 20, offset = 0 } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    let query = 'SELECT * FROM suppliers';

    if (active === 'true') {
      conditions.push('is_active = true');
    } else if (active === 'false') {
      conditions.push('is_active = false');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSupplierById(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const supplierResult = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);

    if (supplierResult.rows.length === 0) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    // Get linked products
    const productsResult = await pool.query(
      `SELECT ps.*, p.name as product_name, p.sku
       FROM product_suppliers ps
       JOIN products p ON ps.product_id = p.id
       WHERE ps.supplier_id = $1`,
      [id]
    );

    res.json({
      ...supplierResult.rows[0],
      products: productsResult.rows,
    });
  } catch (error) {
    console.error('Get supplier by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSupplier(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = CreateSupplierSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.contact_person, data.email, data.phone, data.address]
    );

    await logAuditAction(req.user?.id || null, 'SUPPLIER_CREATED', 'SUPPLIER', result.rows[0].id, null, data, req.ip, req.userAgent);

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Create supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateSupplier(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const data = UpdateSupplierSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE suppliers
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [data.name, data.contact_person, data.email, data.phone, data.address, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'SUPPLIER_UPDATED', 'SUPPLIER', parseInt(id), null, data, req.ip, req.userAgent);

    res.json({
      message: 'Supplier updated successfully',
      supplier: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function deactivateSupplier(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'UPDATE suppliers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await logAuditAction(req.user?.id || null, 'SUPPLIER_DEACTIVATED', 'SUPPLIER', parseInt(id), null, {}, req.ip, req.userAgent);

    res.json({ message: 'Supplier deactivated successfully', supplier: result.rows[0] });
  } catch (error) {
    console.error('Deactivate supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function linkProductToSupplier(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { supplierId, productId } = req.params;
    const data = LinkProductSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, lead_time_days, min_order_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (product_id, supplier_id) DO UPDATE
       SET supplier_sku = COALESCE($3, supplier_sku),
           lead_time_days = COALESCE($4, lead_time_days),
           min_order_quantity = COALESCE($5, min_order_quantity),
           unit_price = COALESCE($6, unit_price)
       RETURNING *`,
      [productId, supplierId, data.supplier_sku, data.lead_time_days, data.min_order_quantity, data.unit_price]
    );

    await logAuditAction(req.user?.id || null, 'PRODUCT_LINKED_TO_SUPPLIER', 'PRODUCT_SUPPLIER', result.rows[0].id, null, data, req.ip, req.userAgent);

    res.json({
      message: 'Product linked to supplier successfully',
      productSupplier: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Link product to supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function getSupplierProducts(req: Request, res: Response): Promise<void> {
  try {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { supplierId } = req.params;

    const result = await pool.query(
      `SELECT ps.*, p.name as product_name, p.sku, p.price as product_price
       FROM product_suppliers ps
       JOIN products p ON ps.product_id = p.id
       WHERE ps.supplier_id = $1
       ORDER BY p.name`,
      [supplierId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
