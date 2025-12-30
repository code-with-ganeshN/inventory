import { AppDataSource } from '../config/database';
import { Product, Category, Order, OrderItem, ShoppingCart } from '../entities/AllEntities';
import { Repository } from 'typeorm';

export class ProductService {
  private productRepository: Repository<Product>;
  private categoryRepository: Repository<Category>;
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private cartRepository: Repository<ShoppingCart>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.cartRepository = AppDataSource.getRepository(ShoppingCart);
  }

  async getAllProducts(filters: {
    category_id?: number;
    active?: string;
    limit: number;
    offset: number;
  }) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c');

    if (filters.category_id) {
      queryBuilder.andWhere('p.category_id = :categoryId', { categoryId: filters.category_id });
    }

    if (filters.active === 'true') {
      queryBuilder.andWhere('p.is_active = true');
    } else if (filters.active === 'false') {
      queryBuilder.andWhere('p.is_active = false');
    }

    const products = await queryBuilder
      .orderBy('p.created_at', 'DESC')
      .limit(filters.limit)
      .offset(filters.offset)
      .getMany();

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price,
      category_id: p.category_id,
      image_url: p.image_url,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      created_at: p.created_at,
      category_name: p.category?.name || null
    }));
  }

  async getProductById(id: number) {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.id = :id', { id })
      .getOne();

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      image_url: product.image_url,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold,
      is_active: product.is_active,
      created_at: product.created_at,
      category_name: product.category?.name || null
    };
  }

  async createProduct(data: {
  name: string;
  sku: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
  stock?: number;
  low_stock_threshold?: number;
}) {
  const existingProduct = await this.productRepository.findOne({
    where: { sku: data.sku }
  });

  if (existingProduct) {
    throw new Error('SKU already exists');
  }

  const product = this.productRepository.create({
    name: data.name,
    sku: data.sku,
    description: data.description ?? null,
    price: data.price,
    category_id: data.category_id,
    image_url: data.image_url ?? null,
    stock: data.stock ?? 0,
    low_stock_threshold: data.low_stock_threshold ?? 10,
  } as Product);

  return this.productRepository.save(product);
}


  async updateProduct(id: number, data: {
    name?: string;
    description?: string;
    price?: number;
    category_id?: number;
    image_url?: string;
  }) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }

    Object.assign(product, data);
    return await this.productRepository.save(product);
  }

  async deactivateProduct(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }

    product.is_active = false;
    return await this.productRepository.save(product);
  }

  async activateProduct(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }

    product.is_active = true;
    return await this.productRepository.save(product);
  }

  async deleteProduct(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.is_active) {
      throw new Error('Product must be deactivated before deletion');
    }

    // Check for pending orders
    const pendingOrdersCount = await this.orderItemRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .where('oi.product_id = :productId', { productId: id })
      .andWhere('o.status NOT IN (:...statuses)', { statuses: ['DELIVERED', 'CANCELLED'] })
      .getCount();

    if (pendingOrdersCount > 0) {
      throw new Error('Cannot delete product with pending orders');
    }

    // Check for items in cart
    const cartItemsCount = await this.cartRepository.count({
      where: { product_id: id }
    });

    if (cartItemsCount > 0) {
      throw new Error('Cannot delete product that exists in shopping carts');
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async searchProducts(filters: {
    query?: string;
    category_id?: number;
    limit: number;
    offset: number;
  }) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.is_active = true');

    if (filters.query) {
      queryBuilder.andWhere('(p.name ILIKE :query OR p.sku ILIKE :query)', {
        query: `%${filters.query}%`
      });
    }

    if (filters.category_id) {
      queryBuilder.andWhere('p.category_id = :categoryId', {
        categoryId: filters.category_id
      });
    }

    const products = await queryBuilder
      .orderBy('p.name', 'ASC')
      .limit(filters.limit)
      .offset(filters.offset)
      .getMany();

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price,
      category_id: p.category_id,
      image_url: p.image_url,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      created_at: p.created_at,
      category_name: p.category?.name || null
    }));
  }
}