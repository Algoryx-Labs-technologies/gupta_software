import type { FilterQuery } from 'mongoose';
import {
  type CreateTenderInput,
  type UpdateTenderInput,
  type TenderFilterInput,
  TenderStatus,
} from '@gupta/shared';
import { TenderModel, getNextTenderSerial, type ITender } from '../../models/Tender.js';
import { LabourExpenseModel } from '../../models/LabourExpense.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatEntityCode } from '../../utils/entityCode.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function buildFilter(filters: TenderFilterInput): FilterQuery<ITender> {
  const query: FilterQuery<ITender> = {};
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { tenderName: new RegExp(filters.search, 'i') },
      { tenderNo: new RegExp(filters.search, 'i') },
      { uniqueId: new RegExp(filters.search, 'i') },
      { code: new RegExp(filters.search, 'i') },
      { bgNumber: new RegExp(filters.search, 'i') },
      { fdrNumber: new RegExp(filters.search, 'i') },
      { 'sites.siteNameRaw': new RegExp(filters.search, 'i') },
    ];
  }
  return query;
}

function normalizeTender<T extends { sites?: ITender['sites'] }>(tender: T): T {
  return { ...tender, sites: tender.sites ?? [] };
}

function normalizeTenders<T extends { sites?: ITender['sites'] }>(tenders: T[]): T[] {
  return tenders.map(normalizeTender);
}

export async function list(filters: TenderFilterInput) {
  const { page, limit, sortBy = 'createdAt', sortOrder } = filters;
  const { skip } = getPagination(page, limit);
  const filter = buildFilter(filters);
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    TenderModel.find(filter)
      .populate('createdBy', 'name')
      .populate('sites.site', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    TenderModel.countDocuments(filter),
  ]);

  return { data: normalizeTenders(data), meta: buildPaginationMeta(page, limit, total) };
}

export async function listForExport(filters: TenderFilterInput) {
  const data = await TenderModel.find(buildFilter(filters))
    .populate('sites.site', 'name code')
    .sort({ createdAt: -1 })
    .lean();
  return normalizeTenders(data);
}

export async function create(input: CreateTenderInput, userId: string) {
  const serialNo = await getNextTenderSerial();
  const code = formatEntityCode('TND', serialNo);
  return TenderModel.create({ ...input, serialNo, code, createdBy: resolveCreatedByRef(userId) });
}

export async function getById(id: string) {
  const tender = await TenderModel.findById(id)
    .populate('createdBy', 'name email')
    .populate('sites.site', 'name code');
  if (!tender) throw new ApiError(404, 'Tender not found');
  return normalizeTender(tender.toObject());
}

export async function update(id: string, input: UpdateTenderInput) {
  const tender = await TenderModel.findByIdAndUpdate(id, input, { new: true, runValidators: true })
    .populate('sites.site', 'name code');
  if (!tender) throw new ApiError(404, 'Tender not found');
  return tender;
}

export async function remove(id: string) {
  const linkedExpenses = await LabourExpenseModel.countDocuments({ tender: id });
  if (linkedExpenses > 0) {
    throw new ApiError(409, 'Cannot delete tender while labour expenses are linked to it');
  }

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
