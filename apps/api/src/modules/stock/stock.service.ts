import type { StockCellInput, CreateStockInput, UpdateStockInput } from '@gupta/shared';
import { StockModel } from '../../models/Stock.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';
import * as inventorySvc from '../inventory/inventory.service.js';

export async function getMatrix() {
  const overview = await inventorySvc.getOverview();
  return {
    items: overview.items.map((item) => ({
      _id: item.itemId ?? item.key,
      name: item.name,
      defaultUnit: item.unit,
    })),
    sites: overview.sites,
    cells: overview.cells.map((cell) => ({
      itemId: overview.items.find((item) => item.key === cell.itemKey)?.itemId ?? cell.itemKey,
      siteId: cell.siteId,
      specification: '',
      quantity: cell.quantity,
    })),
  };
}

export async function upsertCell(input: StockCellInput) {
  const spec = input.specification ?? '';
  const stock = await StockModel.findOneAndUpdate(
    { item: input.itemId, site: input.siteId, specification: spec },
    {
      item: input.itemId,
      site: input.siteId,
      specification: spec,
      quantity: input.quantity,
    },
    { upsert: true, new: true, runValidators: true },
  );
  return stock;
}

export async function list(page: number, limit: number) {
  const { skip } = getPagination(page, limit);
  const [data, total] = await Promise.all([
    StockModel.find()
      .populate('item', 'name')
      .populate('site', 'name code')
      .skip(skip)
      .limit(limit)
      .lean(),
    StockModel.countDocuments(),
  ]);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateStockInput) {
  return StockModel.create(input);
}

export async function getById(id: string) {
  const stock = await StockModel.findById(id).populate('item', 'name').populate('site', 'name code');
  if (!stock) throw new ApiError(404, 'Stock entry not found');
  return stock;
}

export async function update(id: string, input: UpdateStockInput) {
  const stock = await StockModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!stock) throw new ApiError(404, 'Stock entry not found');
  return stock;
}

export async function remove(id: string) {
  const stock = await StockModel.findByIdAndDelete(id);
  if (!stock) throw new ApiError(404, 'Stock entry not found');
  return stock;
}
