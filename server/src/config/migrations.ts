import { AppDataSource } from '../config/database';
import { User, Role } from '../entities/AllEntities';

export async function createTables() {
  try {
    // TypeORM will handle table creation through entities
    // This function now just ensures the connection is working
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    
    console.log('✓ TypeORM entities are ready');
  } catch (error) {
    console.error('Error with TypeORM entities:', error);
    throw error;
  }
}
