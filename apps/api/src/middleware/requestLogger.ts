import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Logs successful requests when the response finishes.
 * Client/server errors are logged by the error handler instead.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    logger.info('Request completed', {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ...(req.user?.sub ? { userId: req.user.sub } : {}),
      ...(req.ip ? { ip: req.ip } : {}),
    });
  });

  next();
}
