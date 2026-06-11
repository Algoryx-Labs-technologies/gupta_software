import api from './axios';
import type {
  AllocateStockInput,
  ConsumeStockInput,
  InventoryLedgerEntry,
  InventoryOverviewResponse,
  InventoryReceipt,
  PaginatedResponse,
} from '@gupta/shared';

export const inventoryApi = {
  overview: () => api.get<InventoryOverviewResponse>('/inventory/overview').then((r) => r.data),
  receipts: () => api.get<{ data: InventoryReceipt[] }>('/inventory/receipts').then((r) => r.data.data),
  ledger: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<InventoryLedgerEntry>>('/inventory/ledger', { params }).then((r) => r.data),
  allocate: (data: AllocateStockInput) => api.post('/inventory/allocate', data).then((r) => r.data),
  consume: (data: ConsumeStockInput) => api.post('/inventory/consume', data).then((r) => r.data),
  backfill: () => api.post('/inventory/backfill').then((r) => r.data),
};
