import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { MAX_UPLOAD_BYTES } from '../utils/upload.js';

function requestMeta(req: Request) {
  return {
    method: req.method,
    path: req.originalUrl || req.url,
    ...(req.user?.sub ? { userId: req.user.sub } : {}),
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl || req.url}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const meta = requestMeta(req);

  if (err instanceof ApiError) {
    const level = err.statusCode >= 500 ? 'error' : 'warn';
    logger[level](err.message, {
      ...meta,
      statusCode: err.statusCode,
      ...(err.errors ? { errors: err.errors } : {}),
    });
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
    logger.warn('Validation failed', { ...meta, statusCode: 400, errors });
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  if (err instanceof multer.MulterError) {
    const maxMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large (max ${maxMb}MB)`
        : `Upload error: ${err.message}`;
    logger.warn(message, { ...meta, statusCode: 400, code: err.code });
    res.status(400).json({ message });
    return;
  }

  if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
    logger.warn('Duplicate entry', { ...meta, statusCode: 409 });
    res.status(409).json({ message: 'Duplicate entry' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error('Unhandled error', { ...meta, statusCode: 500, message, stack });
  res.status(500).json({ message: 'Internal server error' });
}
