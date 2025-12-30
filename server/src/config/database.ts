import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User, Role, Product, Category, Order, OrderItem, ShoppingCart } from '../entities/AllEntities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'inventory_db',
  synchronize: false,
  logging: false,
  entities: [User, Role, Product, Category, Order, OrderItem, ShoppingCart],
  migrations: [],
  subscribers: [],
});