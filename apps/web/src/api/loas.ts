import api from './axios';
import type { Loa, PaginatedResponse } from '@gupta/shared';
import type { CreateLoaInput, UpdateLoaInput } from '@gupta/shared';
import { MAX_UPLOAD_BYTES } from '@/lib/uploadLimits';

export const loasApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Loa>>('/loas', { params }).then((r) => r.data),
  get: (id: string) => api.get<Loa>(`/loas/${id}`).then((r) => r.data),
  create: (data: CreateLoaInput) => api.post<Loa>('/loas', data).then((r) => r.data),
  update: (id: string, data: UpdateLoaInput) =>
    api.patch<Loa>(`/loas/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/loas/${id}`).then((r) => r.data),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Loa>(`/loas/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
        maxBodyLength: MAX_UPLOAD_BYTES,
        maxContentLength: MAX_UPLOAD_BYTES,
      })
      .then((r) => r.data);
  },
  deleteAttachment: (id: string, attId: string) =>
    api.delete<Loa>(`/loas/${id}/attachments/${attId}`).then((r) => r.data),
};
