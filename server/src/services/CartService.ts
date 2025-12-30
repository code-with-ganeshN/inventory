import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ShoppingCart, Product } from '../entities/AllEntities';

export class CartService {
  private cartRepository: Repository<ShoppingCart>;
  private productRepository: Repository<Product>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(ShoppingCart);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async getCart(userId: number) {
    const cartItems = await this.cartRepository
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.product', 'p')
      .where('sc.user_id = :userId', { userId })
      .andWhere('sc.saved_for_later = :savedForLater', { savedForLater: false })
      .orderBy('sc.created_at', 'ASC')
      .getMany();

    let subtotal = 0;
    const items = cartItems.map(item => {
      const itemTotal = item.product.is_active ? item.product.price * item.quantity : 0;
      subtotal += itemTotal;
      return {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        image_url: item.product.image_url,
        is_active: item.product.is_active,
        quantity: item.quantity
      };
    });

    const tax = subtotal * 1.0;
    const total = subtotal + tax;

    return { items, subtotal, tax, total, itemCount: items.length };
  }

  async addToCart(userId: number, productId: number, quantity: number, savedForLater = false) {
    const product = await this.productRepository.findOne({
      where: { id: productId, is_active: true }
    });

    if (!product) {
      throw new Error('Product not found or inactive');
    }

    const existingItem = await this.cartRepository.findOne({
      where: { user_id: userId, product_id: productId }
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.updated_at = new Date();
      return await this.cartRepository.save(existingItem);
    } else {
      const cartItem = this.cartRepository.create({
        user_id: userId,
        product_id: productId,
        quantity,
        saved_for_later: savedForLater
      });
      return await this.cartRepository.save(cartItem);
    }
  }

  async updateCartItem(cartItemId: number, userId: number, quantity: number) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartItemId, user_id: userId }
    });

    if (!cartItem) {
      throw new Error('Forbidden');
    }

    cartItem.quantity = quantity;
    cartItem.updated_at = new Date();
    return await this.cartRepository.save(cartItem);
  }

  async removeFromCart(cartItemId: number, userId: number) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartItemId, user_id: userId }
    });

    if (!cartItem) {
      throw new Error('Forbidden');
    }

    await this.cartRepository.delete({ id: cartItemId });
    return { message: 'Item removed from cart successfully' };
  }

  async clearCart(userId: number) {
    await this.cartRepository.delete({
      user_id: userId,
      saved_for_later: false
    });

    return { message: 'Cart cleared successfully' };
  }

  async getSavedItems(userId: number) {
    const savedItems = await this.cartRepository
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.product', 'p')
      .where('sc.user_id = :userId', { userId })
      .andWhere('sc.saved_for_later = :savedForLater', { savedForLater: true })
      .orderBy('sc.created_at', 'DESC')
      .getMany();

    return savedItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      image_url: item.product.image_url,
      is_active: item.product.is_active,
      quantity: item.quantity,
      created_at: item.created_at
    }));
  }

  async saveForLater(cartItemId: number, userId: number) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartItemId, user_id: userId }
    });

    if (!cartItem) {
      throw new Error('Forbidden');
    }

    await this.cartRepository.update(cartItemId, {
      saved_for_later: true,
      updated_at: new Date()
    });

    return { message: 'Item saved for later successfully' };
  }

  async moveToCart(cartItemId: number, userId: number) {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartItemId, user_id: userId }
    });

    if (!cartItem) {
      throw new Error('Forbidden');
    }

    await this.cartRepository.update(cartItemId, {
      saved_for_later: false,
      updated_at: new Date()
    });

    return { message: 'Item moved to cart successfully' };
  }
}