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
    const { pool } = require('./config/db');
    
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    // Get sample data
    const sampleData = await pool.query('SELECT * FROM categories LIMIT 3');
    
    res.json({
      success: true,
      tableStructure: columns.rows,
      sampleData: sampleData.rows,
      rowCount: sampleData.rows.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint for categories (no auth)
app.get('/api/categories-test', async (_req, res) => {
  try {
    const { pool } = require('./config/db');
    console.log('Testing categories table...');
    
    // Test table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'categories'
    `);
    
    if (tableCheck.rows.length === 0) {
      return res.json({ success: false, error: 'Categories table does not exist' });
    }
    
    // Test select
    const result = await pool.query('SELECT * FROM categories LIMIT 5');
    res.json({ 
      success: true, 
      count: result.rows.length, 
      data: result.rows,
      message: 'Categories fetched successfully'
    });
  } catch (error) {
    console.error('Categories test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code
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
