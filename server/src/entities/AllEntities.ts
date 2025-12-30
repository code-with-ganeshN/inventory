import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

/* ===================== ROLES ===================== */

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}

/* ===================== CATEGORIES ===================== */

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  parent_id!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: 0 })
  display_order!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}

/* ===================== USERS ===================== */

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ nullable: true })
  first_name!: string;

  @Column({ nullable: true })
  last_name!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column()
  role_id!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: false })
  is_locked!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToMany(() => ShoppingCart, (cart) => cart.user)
  cart_items!: ShoppingCart[];
}

/* ===================== PRODUCTS ===================== */

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  category_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price!: number;

  @Column({ nullable: true })
  image_url!: string;

  @Column({ default: 0 })
  stock!: number;

  @Column({ default: 10 })
  low_stock_threshold!: number;

  @Column({ default: 'ACTIVE' })
  status!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  created_by!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items!: OrderItem[];

  @OneToMany(() => ShoppingCart, (cart) => cart.product)
  cart_items!: ShoppingCart[];
}

/* ===================== ORDERS ===================== */

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column({ unique: true })
  order_number!: string;

  @Column({ default: 'PENDING' })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'text', nullable: true })
  shipping_address!: string;

  @Column({ type: 'text', nullable: true })
  billing_address!: string;

  @Column({ nullable: true })
  payment_method!: string;

  @Column({ nullable: true })
  payment_status!: string;

  @Column({ nullable: true })
  tracking_number!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items!: OrderItem[];
}

/* ===================== ORDER ITEMS ===================== */

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @Column()
  product_id!: number;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_price!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.order_items)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}

/* ===================== SHOPPING CART ===================== */

@Entity('shopping_carts')
export class ShoppingCart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  product_id!: number;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ default: false })
  saved_for_later!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.cart_items)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Product, (product) => product.cart_items)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
