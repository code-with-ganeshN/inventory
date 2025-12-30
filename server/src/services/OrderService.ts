import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order, OrderItem, ShoppingCart, Product, User } from '../entities/AllEntities';

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private cartRepository: Repository<ShoppingCart>;
  private productRepository: Repository<Product>;
  private userRepository: Repository<User>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.cartRepository = AppDataSource.getRepository(ShoppingCart);
    this.productRepository = AppDataSource.getRepository(Product);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllOrders(params: { status?: string; user_id?: number; limit?: number; offset?: number }) {
    const { status, user_id, limit = 20, offset = 0 } = params;
    
    const queryBuilder = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .select([
        'o.id', 'o.user_id', 'o.order_number', 'o.status', 'o.total_amount', 
        'o.tax_amount', 'o.shipping_address', 'o.notes', 'o.created_at', 'o.updated_at',
        'u.email', 'u.first_name', 'u.last_name'
      ]);

    if (status) {
      queryBuilder.andWhere('o.status = :status', { status });
    }

    if (user_id) {
      queryBuilder.andWhere('o.user_id = :user_id', { user_id });
    }

    const orders = await queryBuilder
      .orderBy('o.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return orders.map(order => ({
      ...order,
      user_email: order.user.email,
      first_name: order.user.first_name,
      last_name: order.user.last_name
    }));
  }

  async getOrderById(orderId: number, userId?: number, userRole?: string) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .where('o.id = :id', { id: orderId });

    if (userRole === 'USER' && userId) {
      queryBuilder.andWhere('o.user_id = :userId', { userId });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new Error('Order not found');
    }

    const items = await this.orderItemRepository
      .createQueryBuilder('oi')
      .leftJoinAndSelect('oi.product', 'p')
      .where('oi.order_id = :orderId', { orderId })
      .getMany();

    return {
      ...order,
      email: order.user.email,
      first_name: order.user.first_name,
      last_name: order.user.last_name,
      items: items.map(item => ({
        ...item,
        product_name: item.product.name,
        sku: item.product.sku
      }))
    };
  }

  async createOrder(userId: number, orderData: {
    delivery_address: string;
    delivery_phone: string;
    notes?: string;
  }) {
    const cartItems = await this.cartRepository
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.product', 'p')
      .where('sc.user_id = :userId', { userId })
      .andWhere('sc.saved_for_later = :savedForLater', { savedForLater: false })
      .andWhere('p.is_active = :isActive', { isActive: true })
      .getMany();

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Check stock availability for all items
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`);
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity), 0);
    const tax = subtotal * 1.0;
    const total = subtotal + tax;

    const order = this.orderRepository.create({
      user_id: userId,
      order_number: `ORD-${Date.now()}`,
      total_amount: total,
      tax_amount: tax,
      shipping_address: orderData.delivery_address,
      notes: orderData.notes || null
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and deduct stock
    for (const item of cartItems) {
      await this.orderItemRepository.save({
        order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: parseFloat(item.product.price.toString()),
        total_price: parseFloat(item.product.price.toString()) * item.quantity
      });

      // Deduct stock from product and deactivate if stock reaches zero
      const newStock = item.product.stock - item.quantity;
      await this.productRepository.update(
        { id: item.product_id },
        { 
          stock: newStock,
          is_active: newStock > 0,
          updated_at: new Date()
        }
      );
    }

    // Clear cart after successful order
    await this.cartRepository.delete({
      user_id: userId,
      saved_for_later: false
    });

    return savedOrder;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    return await this.orderRepository.save(order);
  }

  async cancelOrder(orderId: number, userId?: number, userRole?: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new Error('Order not found');
    }

    if (userRole === 'USER' && order.user_id !== userId) {
      throw new Error('Forbidden');
    }

    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new Error('Cannot cancel order in current status');
    }

    // Get order items to restore stock
    const orderItems = await this.orderItemRepository.find({
      where: { order_id: orderId }
    });

    // Restore stock for each item
    for (const item of orderItems) {
      // Get current product to check if it was deactivated due to zero stock
      const product = await this.productRepository.findOne({ where: { id: item.product_id } });
      if (product) {
        const newStock = product.stock + item.quantity;
        await this.productRepository.update(
          { id: item.product_id },
          { 
            stock: newStock,
            is_active: true, // Reactivate product when stock is restored
            updated_at: new Date()
          }
        );
      }
    }

    order.status = 'CANCELLED';
    return await this.orderRepository.save(order);
  }

  async getUserOrders(userId: number, params: { limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = params;

    return await this.orderRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  async getOrderStats() {
    const result = await this.orderRepository
      .createQueryBuilder('orders')
      .select([
        'COUNT(*) as total_orders',
        'SUM(CASE WHEN status = \'DELIVERED\' THEN 1 ELSE 0 END) as delivered_orders',
        'SUM(CASE WHEN status = \'PENDING\' THEN 1 ELSE 0 END) as pending_orders',
        'SUM(total_amount) as total_revenue',
        'AVG(total_amount) as average_order_value'
      ])
      .getRawOne();

    return result;
  }
}