import { Request, Response } from 'express';
import { CartService } from '../services/CartService';
import { z } from 'zod';

const AddToCartSchema = z.object({
  product_id: z.number(),
  quantity: z.number().positive(),
  saved_for_later: z.boolean().optional(),
});

const UpdateCartSchema = z.object({
  quantity: z.number().positive(),
});

const cartService = new CartService();

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await cartService.getCart(req.user.id);
    res.json(result);
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
    const cartItem = await cartService.addToCart(
      req.user.id, 
      data.product_id, 
      data.quantity, 
      data.saved_for_later
    );

    res.json({
      message: 'Item added to cart successfully',
      cartItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Add to cart error:', error);
      if (error instanceof Error && error.message === 'Product not found or inactive') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
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

    const cartItem = await cartService.updateCartItem(
      parseInt(cartItemId), 
      req.user.id, 
      data.quantity
    );

    res.json({
      message: 'Cart item updated successfully',
      cartItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('Update cart item error:', error);
      if (error instanceof Error && error.message === 'Forbidden') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
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
    const result = await cartService.removeFromCart(parseInt(cartItemId), req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Remove from cart error:', error);
    if (error instanceof Error && error.message === 'Forbidden') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await cartService.clearCart(req.user.id);
    res.json(result);
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

    const result = await cartService.getSavedItems(req.user.id);
    res.json(result);
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
    const result = await cartService.saveForLater(parseInt(cartItemId), req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Save for later error:', error);
    if (error instanceof Error && error.message === 'Forbidden') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function moveToCart(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cartItemId } = req.params;
    const result = await cartService.moveToCart(parseInt(cartItemId), req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Move to cart error:', error);
    if (error instanceof Error && error.message === 'Forbidden') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
