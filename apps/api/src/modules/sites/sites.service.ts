import { SiteModel } from '../../models/Site.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';
import type { CreateSiteInput, UpdateSiteInput } from '@gupta/shared';

export async function list(page: number, limit: number, search?: string) {
  const { skip } = getPagination(page, limit);
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }] }
    : {};

  const [data, total] = await Promise.all([
    SiteModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    SiteModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateSiteInput) {
  return SiteModel.create(input);
}

export async function getById(id: string) {
  const site = await SiteModel.findById(id);
  if (!site) throw new ApiError(404, 'Site not found');
  return site;
}

export async function update(id: string, input: UpdateSiteInput) {
  const site = await SiteModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!site) throw new ApiError(404, 'Site not found');
  return site;
}

export async function remove(id: string) {
  const site = await SiteModel.findByIdAndDelete(id);
  if (!site) throw new ApiError(404, 'Site not found');
  return site;
}

export async function search(query: string, limit = 20) {
  return SiteModel.find({
    $or: [{ name: new RegExp(query, 'i') }, { code: new RegExp(query, 'i') }],
  })
    .limit(limit)
    .select('name code')
    .lean();
}
