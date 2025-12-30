import { AppDataSource } from '../config/database';
import { Category } from '../entities/AllEntities';

async function checkDatabase() {
  try {
    console.log('Checking TypeORM database connection...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ TypeORM DataSource initialized');
    }
    
    const categoryRepository = AppDataSource.getRepository(Category);
    
    // Check if categories table exists by trying to count
    const categoriesCount = await categoryRepository.count();
    console.log(`✅ Categories table exists with ${categoriesCount} records`);
    
    // Try to create a test category
    const testCategory = categoryRepository.create({
      name: 'Test Category',
      description: 'Test Description',
      is_active: true,
      display_order: 0
    });
    
    const savedCategory = await categoryRepository.save(testCategory);
    console.log('✅ Test category created:', savedCategory);
    
    // Clean up test category
    await categoryRepository.remove(savedCategory);
    console.log('✅ Test category cleaned up');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

checkDatabase();