import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured in environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    (req as AuthRequest).user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid or expired token',
    });
  }
}
