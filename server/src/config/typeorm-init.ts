import 'reflect-metadata';
import { AppDataSource } from './database'

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM Data Source has been initialized!');
  } catch (error) {
    console.error('❌ Error during TypeORM Data Source initialization:', error);
    throw error;
  }
}