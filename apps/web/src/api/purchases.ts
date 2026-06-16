import api from './axios';
import type { Purchase, PaginatedResponse } from '@gupta/shared';
import type { CreatePurchaseInput, UpdatePurchaseInput } from '@gupta/shared';

export const purchasesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Purchase>>('/purchases', { params }).then((r) => r.data),
  get: (id: string) => api.get<Purchase>(`/purchases/${id}`).then((r) => r.data),
  create: (data: CreatePurchaseInput) => api.post<Purchase>('/purchases', data).then((r) => r.data),
  update: (id: string, data: UpdatePurchaseInput) =>
    api.patch<Purchase>(`/purchases/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/purchases/${id}`).then((r) => r.data),
  export: (params?: Record<string, unknown>) =>
    api.get<{ data: Purchase[] }>('/purchases/export', { params }).then((r) => r.data),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Purchase>(`/purchases/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  deleteAttachment: (id: string, attId: string) =>
    api.delete<Purchase>(`/purchases/${id}/attachments/${attId}`).then((r) => r.data),
};
