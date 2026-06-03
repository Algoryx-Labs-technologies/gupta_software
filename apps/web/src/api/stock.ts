import api from './axios';
import type { StockMatrixResponse, StockCellInput } from '@gupta/shared';

export const stockApi = {
  matrix: () => api.get<StockMatrixResponse>('/stock/matrix').then((r) => r.data),
  upsertCell: (data: StockCellInput) => api.put('/stock/cell', data).then((r) => r.data),
};
