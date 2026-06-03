import type { Request, Response, NextFunction } from 'express';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { buildActivityLogPayload } from '../utils/activityLogPayload.js';

export function activityLogger(action: string, entity: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId =
          (body as { data?: { _id?: string }; _id?: string })?.data?._id ??
          (body as { _id?: string })?._id ??
          req.params.id;

        ActivityLogModel.create(
          buildActivityLogPayload({
            userId: req.user.sub,
            action,
            entity,
            entityId: entityId?.toString(),
            ip: req.ip,
            userAgent: req.get('user-agent') ?? undefined,
            meta: { method: req.method, path: req.originalUrl },
            actorName: req.user.name,
            actorEmail: req.user.email,
          }),
        ).catch(console.error);
      }

      return originalJson(body);
    };

    next();
  };
}

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
  req?: Request,
) {
  await ActivityLogModel.create(
    buildActivityLogPayload({
      userId,
      action,
      entity,
      entityId,
      ip: req?.ip,
      userAgent: req?.get('user-agent') ?? undefined,
      meta,
      actorName: req?.user?.name,
      actorEmail: req?.user?.email,
    }),
  );
}
