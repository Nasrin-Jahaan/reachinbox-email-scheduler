import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/index';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
    }

    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
