import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_root';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
    res.status(409).json({ message: 'Duplicate entry' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
