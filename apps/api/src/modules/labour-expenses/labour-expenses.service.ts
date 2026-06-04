import type { FilterQuery } from 'mongoose';
import {
  type CreateLabourExpenseInput,
  type LabourExpenseFilterInput,
} from '@gupta/shared';
import { LabourExpenseModel, type ILabourExpense } from '../../models/LabourExpense.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function buildFilter(filters: LabourExpenseFilterInput): FilterQuery<ILabourExpense> {
  const query: FilterQuery<ILabourExpense> = {};

  if (filters.tender) query.tender = filters.tender;
  if (filters.site) query.site = filters.site;
  if (filters.dateFrom || filters.dateTo) {
    query.expenseDate = {};
    if (filters.dateFrom) query.expenseDate.$gte = filters.dateFrom;
    if (filters.dateTo) query.expenseDate.$lte = filters.dateTo;
  }

  return query;
}

export async function list(filters: LabourExpenseFilterInput) {
  const { page, limit } = filters;
  const { skip } = getPagination(page, limit);
  const filter = buildFilter(filters);

  const [data, total] = await Promise.all([
    LabourExpenseModel.find(filter)
      .populate('tender', 'tenderName tenderNo')
      .populate('site', 'name code')
      .populate('createdBy', 'name')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabourExpenseModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateLabourExpenseInput, userId: string) {
  return LabourExpenseModel.create({
    ...input,
    createdBy: resolveCreatedByRef(userId),
  });
}

export async function remove(id: string) {
  const expense = await LabourExpenseModel.findByIdAndDelete(id);
  if (!expense) throw new ApiError(404, 'Labour expense not found');
  return expense;
}

export async function getSummaryStats(dateFrom?: Date, dateTo?: Date) {
  const match: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    match.expenseDate = {};
    if (dateFrom) (match.expenseDate as Record<string, Date>).$gte = dateFrom;
    if (dateTo) (match.expenseDate as Record<string, Date>).$lte = dateTo;
  }

  const [stats, bySite, recent] = await Promise.all([
    LabourExpenseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
        },
      },
    ]),
    LabourExpenseModel.aggregate([
      { $match: match },
      { $group: { _id: '$siteNameRaw', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $project: { siteName: '$_id', total: 1, count: 1, _id: 0 } },
    ]),
    LabourExpenseModel.find(match)
      .populate('tender', 'tenderName tenderNo')
      .populate('site', 'name code')
      .sort({ expenseDate: -1 })
      .limit(10)
      .lean(),
  ]);

  const summary = stats[0] ?? { totalAmount: 0, totalCount: 0 };

  return {
    totalAmount: summary.totalAmount,
    totalCount: summary.totalCount,
    bySite,
    recent,
  };
}
