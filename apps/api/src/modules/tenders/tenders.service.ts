import type { FilterQuery } from 'mongoose';
import {
  type CreateTenderInput,
  type UpdateTenderInput,
  type TenderFilterInput,
  TenderStatus,
} from '@gupta/shared';
import { TenderModel, getNextTenderSerial, type ITender } from '../../models/Tender.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function buildFilter(filters: TenderFilterInput): FilterQuery<ITender> {
  const query: FilterQuery<ITender> = {};
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { tenderName: new RegExp(filters.search, 'i') },
      { tenderNo: new RegExp(filters.search, 'i') },
      { bgNumber: new RegExp(filters.search, 'i') },
    ];
  }
  return query;
}

export async function list(filters: TenderFilterInput) {
  const { page, limit, sortBy = 'createdAt', sortOrder } = filters;
  const { skip } = getPagination(page, limit);
  const filter = buildFilter(filters);
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    TenderModel.find(filter).populate('createdBy', 'name').sort(sort).skip(skip).limit(limit).lean(),
    TenderModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function listForExport(filters: TenderFilterInput) {
  return TenderModel.find(buildFilter(filters)).sort({ createdAt: -1 }).lean();
}

export async function create(input: CreateTenderInput, userId: string) {
  const serialNo = await getNextTenderSerial();
  return TenderModel.create({ ...input, serialNo, createdBy: resolveCreatedByRef(userId) });
}

export async function getById(id: string) {
  const tender = await TenderModel.findById(id).populate('createdBy', 'name email');
  if (!tender) throw new ApiError(404, 'Tender not found');
  return tender;
}

export async function update(id: string, input: UpdateTenderInput) {
  const tender = await TenderModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!tender) throw new ApiError(404, 'Tender not found');
  return tender;
}

export async function remove(id: string) {
  const tender = await TenderModel.findByIdAndDelete(id);
  if (!tender) throw new ApiError(404, 'Tender not found');
  return tender;
}

export async function addAttachment(id: string, filename: string, url: string) {
  const tender = await TenderModel.findByIdAndUpdate(
    id,
    { $push: { attachments: { filename, url, uploadedAt: new Date() } } },
    { new: true },
  );
  if (!tender) throw new ApiError(404, 'Tender not found');
  return tender;
}

export { TenderStatus };
