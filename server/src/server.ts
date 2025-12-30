import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { initializeDatabase } from './config/seeds';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize TypeORM
    await AppDataSource.initialize();
    console.log('✅ TypeORM Data Source has been initialized!');
    
    // Run seeds
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error during server startup:', error);
    process.exit(1);
  }
}

startServer();
