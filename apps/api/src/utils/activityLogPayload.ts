import mongoose from 'mongoose';
import { isSystemAdminSub, getSystemAdminProfile } from '../config/admin.js';

export function buildActivityLogPayload(input: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  actorName?: string;
  actorEmail?: string;
}) {
  const meta: Record<string, unknown> = { ...input.meta };

  if (isSystemAdminSub(input.userId)) {
    const admin = getSystemAdminProfile();
    meta.actorName = admin.name;
    meta.actorEmail = admin.email;
    meta.isSystemAdmin = true;
  } else if (input.actorName || input.actorEmail) {
    meta.actorName = input.actorName;
    meta.actorEmail = input.actorEmail;
  }

  const payload: {
    userId: string;
    userRef?: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId?: string;
    ip?: string;
    userAgent?: string;
    meta?: Record<string, unknown>;
  } = {
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    ip: input.ip,
    userAgent: input.userAgent,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };

  if (mongoose.isValidObjectId(input.userId) && String(input.userId).length === 24) {
    payload.userRef = new mongoose.Types.ObjectId(input.userId);
  }

  return payload;
}
