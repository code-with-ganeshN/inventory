import { Request, Response } from 'express';
import { pool } from '../config/db';
import { z } from 'zod';

const AddToCartSchema = z.object({
  product_id: z.number(),
  quantity: z.number().positive(),
  saved_for_later: z.boolean().optional(),
});

const UpdateCartSchema = z.object({
  quantity: z.number().positive(),
});

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `SELECT sc.*, p.name as product_name, p.sku, p.price, p.image_url
       FROM shopping_carts sc
       JOIN products p ON sc.product_id = p.id
       WHERE sc.user_id = $1 AND sc.saved_for_later = false
       ORDER BY sc.created_at`,
      [req.user.id]
    );

    // Calculate totals
    let subtotal = 0;
    for (const item of result.rows) {
      subtotal += item.price * item.quantity;
    }

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    res.json({
      items: result.rows,
      subtotal,
      tax,
      total,
      itemCount: result.rows.length,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = AddToCartSchema.parse(req.body);

    // Check if product exists and is active
    const productCheck = await pool.query('SELECT id, price FROM products WHERE id = $1 AND is_active = true', [data.product_id]);
    if (productCheck.rows.length === 0) {
      res.status(404).json({ error: 'Product not found or inactive' });
      return;
    }

    // Check if already in cart
    const existingItem = await pool.query(
      'SELECT id, quantity FROM shopping_carts WHERE user_id = $1 AND product_id = $2',
      [req.user.id, data.product_id]
    );

    let result;
    if (existingItem.rows.length > 0) {
      // Update quantity
      result = await pool.query(
        `UPDATE shopping_carts
         SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND product_id = $3
         RETURNING *`,
        [data.quantity, req.user.id, data.product_id]
      );
    } else {
      // Add new item
      result = await pool.query(
        `INSERT INTO shopping_carts (user_id, product_id, quantity, saved_for_later)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, data.product_id, data.quantity, data.saved_for_later || false]
      );
    }

    res.json({
      message: 'Item added to cart successfully',
      cartItem: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Add to cart error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cartItemId } = req.params;
    const data = UpdateCartSchema.parse(req.body);

    // Check authorization
    const cartItemCheck = await pool.query('SELECT user_id FROM shopping_carts WHERE id = $1', [cartItemId]);
    if (cartItemCheck.rows.length === 0 || cartItemCheck.rows[0].user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      `UPDATE shopping_carts
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [data.quantity, cartItemId, req.user.id]
    );

    res.json({
      message: 'Cart item updated successfully',
      cartItem: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update cart item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function removeFromCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cartItemId } = req.params;

    // Check authorization
    const cartItemCheck = await pool.query('SELECT user_id FROM shopping_carts WHERE id = $1', [cartItemId]);
    if (cartItemCheck.rows.length === 0 || cartItemCheck.rows[0].user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await pool.query('DELETE FROM shopping_carts WHERE id = $1', [cartItemId]);

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await pool.query('DELETE FROM shopping_carts WHERE user_id = $1 AND saved_for_later = false', [req.user.id]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSavedItems(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `SELECT sc.*, p.name as product_name, p.sku, p.price, p.image_url
       FROM shopping_carts sc
       JOIN products p ON sc.product_id = p.id
       WHERE sc.user_id = $1 AND sc.saved_for_later = true
       ORDER BY sc.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function saveForLater(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cartItemId } = req.params;

    const cartItemCheck = await pool.query('SELECT user_id FROM shopping_carts WHERE id = $1', [cartItemId]);
    if (cartItemCheck.rows.length === 0 || cartItemCheck.rows[0].user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await pool.query(
      'UPDATE shopping_carts SET saved_for_later = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [cartItemId]
    );

    res.json({ message: 'Item saved for later successfully' });
  } catch (error) {
    console.error('Save for later error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function moveToCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cartItemId } = req.params;

    const cartItemCheck = await pool.query('SELECT user_id FROM shopping_carts WHERE id = $1', [cartItemId]);
    if (cartItemCheck.rows.length === 0 || cartItemCheck.rows[0].user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await pool.query(
      'UPDATE shopping_carts SET saved_for_later = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [cartItemId]
    );

    res.json({ message: 'Item moved to cart successfully' });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
