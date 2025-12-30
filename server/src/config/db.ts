import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Fallback database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

console.log('Database config:', {
  ...dbConfig,
  password: '***'
});

export const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (error) => {
  console.error('❌ PostgreSQL error:', error.message);
  console.error('Error code:', error.code);
});
