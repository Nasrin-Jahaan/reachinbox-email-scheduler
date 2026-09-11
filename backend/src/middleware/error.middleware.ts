import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`❌ Request Error [${req.method} ${req.path}]: ${err.message}`, {
    stack: err.stack,
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
}
