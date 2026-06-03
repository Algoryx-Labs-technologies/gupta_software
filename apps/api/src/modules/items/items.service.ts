import { ItemModel } from '../../models/Item.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';
import type { CreateItemInput, UpdateItemInput } from '@gupta/shared';

export async function list(page: number, limit: number, search?: string) {
  const { skip } = getPagination(page, limit);
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { category: new RegExp(search, 'i') }] }
    : {};

  const [data, total] = await Promise.all([
    ItemModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    ItemModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateItemInput) {
  return ItemModel.create(input);
}

export async function getById(id: string) {
  const item = await ItemModel.findById(id);
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
}

export async function update(id: string, input: UpdateItemInput) {
  const item = await ItemModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
}

export async function remove(id: string) {
  const item = await ItemModel.findByIdAndDelete(id);
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
}

export async function search(query: string, limit = 20) {
  return ItemModel.find({ name: new RegExp(query, 'i') })
    .limit(limit)
    .select('name category defaultUnit')
    .lean();
}
