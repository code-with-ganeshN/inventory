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
