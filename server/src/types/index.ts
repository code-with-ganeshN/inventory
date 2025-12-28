export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role_id: number;
  is_active: boolean;
  is_locked: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  module: string;
  created_at: Date;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  category_id: number;
  is_active: boolean;
  image_url?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Inventory {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity_on_hand: number;
  low_stock_threshold: number;
  reorder_quantity: number;
  last_counted?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  tax?: number;
  total: number;
  delivery_address: string;
  delivery_phone?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  order_date: Date;
  expected_delivery_date?: Date;
  actual_delivery_date?: Date;
  status: 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  notes?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingCart {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  saved_for_later: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}
