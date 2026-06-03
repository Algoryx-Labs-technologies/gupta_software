import api from './axios';
import type { DashboardSummary, ActivityLog, PaginatedResponse } from '@gupta/shared';

export const dashboardApi = {
  summary: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<DashboardSummary>('/dashboard/summary', { params }).then((r) => r.data),
};

export const activityApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ActivityLog>>('/activity', { params }).then((r) => r.data),
  export: (params?: Record<string, unknown>) =>
    api.get<{ data: ActivityLog[] }>('/activity/export', { params }).then((r) => r.data),
};
