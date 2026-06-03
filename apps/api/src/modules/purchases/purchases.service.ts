import type { FilterQuery } from 'mongoose';
import {
  computePurchaseTotals,
  type CreatePurchaseInput,
  type UpdatePurchaseInput,
  type PurchaseFilterInput,
} from '@gupta/shared';
import { PurchaseModel, getNextPurchaseSerial, type IPurchase } from '../../models/Purchase.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function applyTotals(input: CreatePurchaseInput | UpdatePurchaseInput) {
  return computePurchaseTotals({
    qty: input.qty,
    perRate: input.perRate,
    freight: input.freight ?? 0,
    labour: input.labour ?? 0,
    gstPercent: input.gstPercent ?? 18,
  });
}

function buildFilter(filters: PurchaseFilterInput): FilterQuery<IPurchase> {
  const query: FilterQuery<IPurchase> = {};

  if (filters.site) query.site = filters.site;
  if (filters.vendor) query.vendor = filters.vendor;
  if (filters.dateFrom || filters.dateTo) {
    query.billDate = {};
    if (filters.dateFrom) query.billDate.$gte = filters.dateFrom;
    if (filters.dateTo) query.billDate.$lte = filters.dateTo;
  }
  if (filters.search) {
    query.$or = [
      { billNo: new RegExp(filters.search, 'i') },
      { itemDescription: new RegExp(filters.search, 'i') },
      { vendorNameRaw: new RegExp(filters.search, 'i') },
      { siteNameRaw: new RegExp(filters.search, 'i') },
    ];
  }

  return query;
}

export async function list(filters: PurchaseFilterInput) {
  const { page, limit, sortBy = 'billDate', sortOrder } = filters;
  const { skip } = getPagination(page, limit);
  const filter = buildFilter(filters);
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    PurchaseModel.find(filter)
      .populate('vendor', 'name')
      .populate('site', 'name code')
      .populate('item', 'name')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    PurchaseModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function listForExport(filters: PurchaseFilterInput) {
  const filter = buildFilter(filters);
  return PurchaseModel.find(filter)
    .populate('vendor', 'name')
    .populate('site', 'name code')
    .sort({ billDate: -1 })
    .lean();
}

export async function create(input: CreatePurchaseInput, userId: string) {
  const totals = applyTotals(input);
  const serialNo = await getNextPurchaseSerial();

  return PurchaseModel.create({
    ...input,
    ...totals,
    serialNo,
    createdBy: resolveCreatedByRef(userId),
  });
}

export async function getById(id: string) {
  const purchase = await PurchaseModel.findById(id)
    .populate('vendor', 'name gstin')
    .populate('site', 'name code')
    .populate('item', 'name')
    .populate('createdBy', 'name email');

  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}

export async function update(id: string, input: UpdatePurchaseInput) {
  const existing = await PurchaseModel.findById(id);
  if (!existing) throw new ApiError(404, 'Purchase not found');

  const merged = {
    qty: input.qty ?? existing.qty,
    perRate: input.perRate ?? existing.perRate,
    freight: input.freight ?? existing.freight,
    labour: input.labour ?? existing.labour,
    gstPercent: input.gstPercent ?? existing.gstPercent,
  };

  const totals = applyTotals(merged);

  const purchase = await PurchaseModel.findByIdAndUpdate(
    id,
    { ...input, ...totals },
    { new: true, runValidators: true },
  )
    .populate('vendor', 'name')
    .populate('site', 'name code');

  return purchase;
}

export async function remove(id: string) {
  const purchase = await PurchaseModel.findByIdAndDelete(id);
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}

export async function addAttachment(id: string, filename: string, url: string) {
  const purchase = await PurchaseModel.findByIdAndUpdate(
    id,
    { $push: { attachments: { filename, url, uploadedAt: new Date() } } },
    { new: true },
  );
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}

export async function removeAttachment(id: string, attId: string) {
  const purchase = await PurchaseModel.findByIdAndUpdate(
    id,
    { $pull: { attachments: { _id: attId } } },
    { new: true },
  );
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}
