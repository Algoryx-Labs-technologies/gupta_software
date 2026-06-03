import api from './axios';
import type { Tender, PaginatedResponse } from '@gupta/shared';
import type { CreateTenderInput, UpdateTenderInput } from '@gupta/shared';

export const tendersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Tender>>('/tenders', { params }).then((r) => r.data),
  get: (id: string) => api.get<Tender>(`/tenders/${id}`).then((r) => r.data),
  create: (data: CreateTenderInput) => api.post<Tender>('/tenders', data).then((r) => r.data),
  update: (id: string, data: UpdateTenderInput) =>
    api.patch<Tender>(`/tenders/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/tenders/${id}`).then((r) => r.data),
  export: (params?: Record<string, unknown>) =>
    api.get<{ data: Tender[] }>('/tenders/export', { params }).then((r) => r.data),
};
