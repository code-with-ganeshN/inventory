import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to set ip and userAgent for all requests
app.use((req, _res, next) => {
  const clientIp = req.ip || (req.socket.remoteAddress as any);
  (req as any).clientIp = clientIp;
  (req as any).userAgent = req.headers['user-agent'];
  next();
});

app.get('/', (_req, res) => {
  res.send({ status: 'ok' });
});

// Database inspection endpoint
app.get('/api/db-info', async (_req, res) => {
  try {
    const { AppDataSource } = require('./config/database');
    const { Category } = require('./entities/AllEntities');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const categoryRepository = AppDataSource.getRepository(Category);
    
    // Get sample data
    const sampleData = await categoryRepository.find({ take: 3 });
    const count = await categoryRepository.count();
    
    res.json({
      success: true,
      sampleData: sampleData,
      rowCount: count
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test endpoint for categories (no auth)
app.get('/api/categories-test', async (_req, res) => {
  try {
    const { AppDataSource } = require('./config/database');
    const { Category } = require('./entities/AllEntities');
    console.log('Testing categories table...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const categoryRepository = AppDataSource.getRepository(Category);
    
    // Test select
    const result = await categoryRepository.find({ take: 5 });
    res.json({ 
      success: true, 
      count: result.length, 
      data: result,
      message: 'Categories fetched successfully'
    });
  } catch (error) {
    console.error('Categories test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
