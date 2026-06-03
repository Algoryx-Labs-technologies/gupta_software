import type { Request, Response, NextFunction } from 'express';
import { hasAnyPermission, type Permission } from '@gupta/shared';
import { ApiError } from '../utils/ApiError.js';

export function authorize(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'));
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      next(new ApiError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
