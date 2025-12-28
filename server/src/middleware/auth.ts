import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JWTPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      ip?: string;
      userAgent?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return;
  }

  req.user = payload;
  const clientIp = req.ip || (req.socket.remoteAddress as any);
  req.userAgent = req.headers['user-agent'];
  (req as any).clientIp = clientIp;

  next();
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      return;
    }

    next();
  };
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  const clientIp = req.ip || (req.socket.remoteAddress as any);
  req.userAgent = req.headers['user-agent'];
  (req as any).clientIp = clientIp;

  next();
}
