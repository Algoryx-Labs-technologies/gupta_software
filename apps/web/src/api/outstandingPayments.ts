import api from './axios';
import type { OutstandingPayment, PaginatedResponse } from '@gupta/shared';
import type { CreateOutstandingPaymentInput } from '@gupta/shared';

export type OutstandingPaymentSummary = {
  totalAmount: number;
  totalCount: number;
  byTender: {
    tenderId: string;
    tenderName: string;
    tenderNo: string;
    total: number;
    count: number;
  }[];
  recent: OutstandingPayment[];
};

export const outstandingPaymentsApi = {
  list: (params?: Record<string, unknown>) =>
    api
      .get<PaginatedResponse<OutstandingPayment>>('/outstanding-payments', { params })
      .then((r) => r.data),
  create: (data: CreateOutstandingPaymentInput) =>
    api.post<OutstandingPayment>('/outstanding-payments', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/outstanding-payments/${id}`).then((r) => r.data),
  summary: (params?: Record<string, unknown>) =>
    api.get<OutstandingPaymentSummary>('/outstanding-payments/summary', { params }).then((r) => r.data),
};
