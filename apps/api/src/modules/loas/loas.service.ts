import type { FilterQuery } from 'mongoose';
import {
  type CreateLoaInput,
  type LoaFilterInput,
  type UpdateLoaInput,
} from '@gupta/shared';
import { LoaModel, getNextLoaSerial, type ILoa } from '../../models/Loa.js';
import { TenderModel } from '../../models/Tender.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { removeStoredAttachment } from '../../utils/attachmentStorage.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function buildFilter(filters: LoaFilterInput): FilterQuery<ILoa> {
  const query: FilterQuery<ILoa> = {};

  if (filters.tender) query.tender = filters.tender;
  if (filters.dateFrom || filters.dateTo) {
    query.loaDate = {};
    if (filters.dateFrom) query.loaDate.$gte = filters.dateFrom;
    if (filters.dateTo) query.loaDate.$lte = filters.dateTo;
  }
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [{ loaNumber: regex }, { title: regex }, { notes: regex }];
  }

  return query;
}

export async function list(filters: LoaFilterInput) {
  const { page, limit, sortBy = 'loaDate', sortOrder } = filters;
  const { skip } = getPagination(page, limit);
  const filter = buildFilter(filters);
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
    serialNo: -1,
  };

  const [data, total] = await Promise.all([
    LoaModel.find(filter)
      .populate('tender', 'tenderName tenderNo code')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    LoaModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: string) {
  const loa = await LoaModel.findById(id)
    .populate('tender', 'tenderName tenderNo code')
    .populate('createdBy', 'name email')
    .lean();
  if (!loa) throw new ApiError(404, 'LOA not found');
  return loa;
}

export async function create(input: CreateLoaInput, userId: string) {
  if (input.tender) {
    const tender = await TenderModel.findById(input.tender).select('_id').lean();
    if (!tender) throw new ApiError(404, 'Tender not found');
  }

  const serialNo = await getNextLoaSerial();
  const loa = await LoaModel.create({
    ...input,
    serialNo,
    createdBy: resolveCreatedByRef(userId),
  });

  return LoaModel.findById(loa._id)
    .populate('tender', 'tenderName tenderNo code')
    .populate('createdBy', 'name')
    .lean();
}

export async function update(id: string, input: UpdateLoaInput) {
  if (input.tender) {
    const tender = await TenderModel.findById(input.tender).select('_id').lean();
    if (!tender) throw new ApiError(404, 'Tender not found');
  }

  const loa = await LoaModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  })
    .populate('tender', 'tenderName tenderNo code')
    .populate('createdBy', 'name')
    .lean();

  if (!loa) throw new ApiError(404, 'LOA not found');
  return loa;
}

export async function remove(id: string) {
  const loa = await LoaModel.findById(id);
  if (!loa) throw new ApiError(404, 'LOA not found');

  for (const attachment of loa.attachments) {
    if (attachment.url?.startsWith('http')) {
      await removeStoredAttachment(attachment.url);
    }
  }

  await LoaModel.findByIdAndDelete(id);
  return loa;
}

export async function addAttachment(id: string, filename: string, url: string) {
  const loa = await LoaModel.findByIdAndUpdate(
    id,
    { $push: { attachments: { filename, url, uploadedAt: new Date() } } },
    { new: true },
  )
    .populate('tender', 'tenderName tenderNo code')
    .populate('createdBy', 'name');

  if (!loa) throw new ApiError(404, 'LOA not found');
  return loa;
}

export async function removeAttachment(id: string, attId: string) {
  const loa = await LoaModel.findById(id);
  if (!loa) throw new ApiError(404, 'LOA not found');

  const attachment = loa.attachments.find((att) => att._id?.toString() === attId);
  if (attachment?.url?.startsWith('http')) {
    await removeStoredAttachment(attachment.url);
  }

  const updated = await LoaModel.findByIdAndUpdate(
    id,
    { $pull: { attachments: { _id: attId } } },
    { new: true },
  )
    .populate('tender', 'tenderName tenderNo code')
    .populate('createdBy', 'name');

  if (!updated) throw new ApiError(404, 'LOA not found');
  return updated;
}
