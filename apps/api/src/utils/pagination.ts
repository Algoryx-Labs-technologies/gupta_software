export interface PaginationOptions {
  page: number;
  limit: number;
}

export function getPagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
