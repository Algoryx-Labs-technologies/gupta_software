import { ActivityLogModel } from '../../models/ActivityLog.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function formatLogUser(log: {
  userId: string;
  userRef?: unknown;
  meta?: { actorName?: string; actorEmail?: string };
}) {
  const ref = log.userRef as { name?: string; email?: string } | null | undefined;
  if (ref && typeof ref === 'object' && 'name' in ref) {
    return { _id: log.userId, name: ref.name ?? 'User', email: ref.email ?? '' };
  }
  return {
    _id: log.userId,
    name: (log.meta?.actorName as string) ?? log.userId,
    email: (log.meta?.actorEmail as string) ?? '',
  };
}

export async function list(
  page: number,
  limit: number,
  filters?: { entity?: string; action?: string; search?: string },
) {
  const { skip } = getPagination(page, limit);
  const query: Record<string, unknown> = {};

  if (filters?.entity) query.entity = filters.entity;
  if (filters?.action) query.action = filters.action;
  if (filters?.search) {
    query.$or = [
      { action: new RegExp(filters.search, 'i') },
      { entity: new RegExp(filters.search, 'i') },
      { entityId: new RegExp(filters.search, 'i') },
      { userId: new RegExp(filters.search, 'i') },
    ];
  }

  const [rows, total] = await Promise.all([
    ActivityLogModel.find(query)
      .populate('userRef', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLogModel.countDocuments(query),
  ]);

  const data = rows.map((log) => ({
    ...log,
    user: formatLogUser(log),
  }));

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function exportLogs(filters?: { entity?: string; action?: string }) {
  const query: Record<string, unknown> = {};
  if (filters?.entity) query.entity = filters.entity;
  if (filters?.action) query.action = filters.action;

  const rows = await ActivityLogModel.find(query)
    .populate('userRef', 'name email')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  return rows.map((log) => ({
    ...log,
    user: formatLogUser(log),
  }));
}
