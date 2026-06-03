export interface ActivityLog {
  _id: string;
  userId?: string;
  user: string | { _id: string; name: string; email: string };
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: string | Date;
}
