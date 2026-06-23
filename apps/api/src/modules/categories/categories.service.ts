import { CategoryModel, getNextCategorySerial } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatEntityCode } from '../../utils/entityCode.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '@gupta/shared';

export async function list(page: number, limit: number, search?: string) {
  const { skip } = getPagination(page, limit);
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }] }
    : {};

  const [data, total] = await Promise.all([
    CategoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    CategoryModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateCategoryInput) {
  const serialNo = await getNextCategorySerial();
  const code = formatEntityCode('CAT', serialNo);
  return CategoryModel.create({ ...input, serialNo, code });
}

export async function getById(id: string) {
  const category = await CategoryModel.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

export async function update(id: string, input: UpdateCategoryInput) {
  const category = await CategoryModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

export async function remove(id: string) {
  const category = await CategoryModel.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

export async function search(query: string, limit = 20) {
  return CategoryModel.find({
    $or: [{ name: new RegExp(query, 'i') }, { code: new RegExp(query, 'i') }],
  })
    .limit(limit)
    .select('name code')
    .lean();
}
