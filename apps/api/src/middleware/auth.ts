import type { Request, Response, NextFunction } from 'express';
import { Role } from '@gupta/shared';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { UserModel } from '../models/User.js';
import { getSystemAdminProfile, isSystemAdminSub } from '../config/admin.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { name: string };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);

    if (isSystemAdminSub(payload.sub)) {
      const admin = getSystemAdminProfile();
      req.user = {
        sub: admin._id,
        email: admin.email,
        role: Role.ADMIN,
        name: admin.name,
      };
      next();
      return;
    }

    const user = await UserModel.findById(payload.sub).select('name email role disabled');

    if (!user || user.disabled) {
      throw new ApiError(401, 'Account disabled or not found');
    }

    req.user = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, 'Invalid or expired token'));
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  authenticate(req, _res, next);
}
