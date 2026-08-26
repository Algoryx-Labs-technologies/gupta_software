import mongoose from 'mongoose';
import { TenderStatus, buildMongoSafeBillDateMatch } from '@gupta/shared';
import { PurchaseModel } from '../../models/Purchase.js';
import { TenderModel } from '../../models/Tender.js';
import * as inventorySvc from '../inventory/inventory.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import * as labourExpenseSvc from '../labour-expenses/labour-expenses.service.js';
import * as employeeSvc from '../employees/employees.service.js';

const SUMMARY_LOG = '[dashboard/summary]';

async function timedStage<T>(
  stage: string,
  ctx: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  logger.info(`${SUMMARY_LOG} stage start: ${stage}`, ctx);
  try {
    const result = await fn();
    logger.info(`${SUMMARY_LOG} stage ok: ${stage}`, {
      ...ctx,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (err) {
    logger.error(`${SUMMARY_LOG} stage failed: ${stage}`, {
      ...ctx,
      durationMs: Date.now() - startedAt,
      errorName: err instanceof Error ? err.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function normalizeDateRange(dateFrom?: Date, dateTo?: Date) {
  return {
    dateFrom: dateFrom ? startOfDay(dateFrom) : undefined,
    dateTo: dateTo ? endOfDay(dateTo) : undefined,
  };
}

function buildPurchaseMatch(dateFrom?: Date, dateTo?: Date, tender?: string) {
  const purchaseMatch: Record<string, unknown> = {};
  if (tender) purchaseMatch.tender = new mongoose.Types.ObjectId(tender);

  const billDateBounds: { $gte?: Date; $lte?: Date } = {};
  if (dateFrom) billDateBounds.$gte = dateFrom;
  if (dateTo) billDateBounds.$lte = dateTo;
  purchaseMatch.billDate = buildMongoSafeBillDateMatch(billDateBounds);

  return purchaseMatch;
}

async function getTenderSection(tender?: string) {
  if (!tender) {
    const [tenderStats, statusCounts, expiringBgs] = await Promise.all([
      TenderModel.aggregate([
        {
          $group: {
            _id: null,
            totalOrderValue: { $sum: '$orderValue' },
            totalOutstanding: { $sum: '$paymentOutstanding' },
            activeOrderValue: {
              $sum: {
                $cond: [{ $eq: ['$status', TenderStatus.ACTIVE] }, '$orderValue', 0],
              },
            },
          },
        },
      ]),
      TenderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      TenderModel.find({
        bgExpiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        status: { $in: [TenderStatus.ACTIVE, TenderStatus.PENDING] },
      })
        .select('tenderName tenderNo bgNumber bgExpiryDate')
        .lean(),
    ]);

    return { tenderStats, statusCounts, expiringBgs };
  }

  const selected = await TenderModel.findById(tender)
    .select('tenderName tenderNo orderValue paymentOutstanding status bgNumber bgExpiryDate sites progress')
    .lean();

  if (!selected) {
    throw new ApiError(404, 'Tender not found');
  }

  const statusCounts = await TenderModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const expiringBgs =
    selected.bgExpiryDate &&
    selected.bgExpiryDate >= new Date() &&
    selected.bgExpiryDate <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) &&
    [TenderStatus.ACTIVE, TenderStatus.PENDING].includes(selected.status)
      ? [selected]
      : [];

  return {
    tenderStats: [
      {
        totalOrderValue: selected.orderValue,
        totalOutstanding: selected.paymentOutstanding,
        activeOrderValue: selected.status === TenderStatus.ACTIVE ? selected.orderValue : 0,
      },
    ],
    statusCounts,
    expiringBgs,
    selected,
  };
}

async function getLowStock(
  tender?: string,
  selectedTender?: { sites?: { site?: mongoose.Types.ObjectId }[] },
) {
  logger.info(`${SUMMARY_LOG} lowStock: fetching inventory overview`);
  const overview = await inventorySvc.getOverview();
  logger.info(`${SUMMARY_LOG} lowStock: overview loaded`, {
    sites: overview.sites.length,
    items: overview.items.length,
    cells: overview.cells.length,
  });

  let cells = overview.cells.filter((cell) => cell.quantity > 0 && cell.quantity <= 5);

  if (tender) {
    if (!selectedTender) return [];

    const siteIds = new Set(
      (selectedTender.sites ?? [])
        .map((s) => s.site?.toString())
        .filter((id): id is string => Boolean(id)),
    );

    if (siteIds.size === 0) return [];

    cells = cells.filter((cell) => siteIds.has(cell.siteId));
  }

  return cells.slice(0, 20).map((cell) => {
    const item = overview.items.find((entry) => entry.key === cell.itemKey);
    const site = overview.sites.find((entry) => entry._id.toString() === cell.siteId);
    return {
      item: { _id: item?.itemId ?? cell.itemKey, name: item?.name ?? 'Unknown' },
      site: { _id: cell.siteId, name: site?.name ?? 'Unknown' },
      quantity: cell.quantity,
    };
  });
}

function buildSalaryExpenseStats(
  summary: Awaited<ReturnType<typeof employeeSvc.getTenderExpenseSummary>>,
  tender?: string,
) {
  if (tender) {
    const selected = summary as {
      totalExpense: number;
      totalDays: number;
      employees: unknown[];
    } | null;

    return {
      totalAmount: selected?.totalExpense ?? 0,
      totalDays: selected?.totalDays ?? 0,
      employeeCount: selected?.employees?.length ?? 0,
      byTender: [],
    };
  }

  const summaries = (summary as Array<{
    tender: { _id: string; tenderName: string; tenderNo: string };
    totalExpense: number;
    totalDays: number;
    employees: unknown[];
  }>) ?? [];

  return {
    totalAmount: summaries.reduce((sum, row) => sum + row.totalExpense, 0),
    totalDays: summaries.reduce((sum, row) => sum + row.totalDays, 0),
    employeeCount: summaries.reduce((sum, row) => sum + (row.employees?.length ?? 0), 0),
    byTender: summaries
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 5)
      .map((row) => ({
        tenderId: row.tender._id,
        tenderName: row.tender.tenderName,
        tenderNo: row.tender.tenderNo,
        total: row.totalExpense,
        totalDays: row.totalDays,
      })),
  };
}

export async function getSummary(dateFrom?: Date, dateTo?: Date, tender?: string) {
  const startedAt = Date.now();
  const ctx: Record<string, unknown> = {
    dateFrom: dateFrom?.toISOString?.() ?? dateFrom ?? null,
    dateTo: dateTo?.toISOString?.() ?? dateTo ?? null,
    tender: tender ?? null,
  };

  logger.info(`${SUMMARY_LOG} request start`, ctx);

  try {
    const normalizedDates = normalizeDateRange(dateFrom, dateTo);
    const purchaseMatch = buildPurchaseMatch(
      normalizedDates.dateFrom,
      normalizedDates.dateTo,
      tender,
    );

    logger.info(`${SUMMARY_LOG} normalized filters`, {
      ...ctx,
      normalizedDateFrom: normalizedDates.dateFrom?.toISOString() ?? null,
      normalizedDateTo: normalizedDates.dateTo?.toISOString() ?? null,
      purchaseMatchKeys: Object.keys(purchaseMatch),
    });

    const tenderSection = await timedStage('tenderSection', ctx, () => getTenderSection(tender));
    const selectedTender = 'selected' in tenderSection ? tenderSection.selected : undefined;

    const [
      purchaseStats,
      bySite,
      byMonth,
      topVendors,
      lowStock,
      labourExpenses,
      salaryExpenseSummary,
    ] = await Promise.all([
      timedStage('purchaseStats', ctx, () =>
        PurchaseModel.aggregate([
          { $match: purchaseMatch },
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalGrandValue: { $sum: '$grandTotal' },
              totalGst: { $sum: '$gstAmount' },
              totalFreightLabour: {
                $sum: {
                  $reduce: {
                    input: { $ifNull: ['$items', []] },
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $add: [
                            { $ifNull: ['$$this.freight', 0] },
                            { $ifNull: ['$$this.labour', 0] },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ]),
      ),
      timedStage('purchasesBySite', ctx, () =>
        PurchaseModel.aggregate([
          { $match: purchaseMatch },
          { $group: { _id: '$site', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
          {
            $lookup: { from: 'sites', localField: '_id', foreignField: '_id', as: 'site' },
          },
          { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              siteId: '$_id',
              siteName: { $ifNull: ['$site.name', 'Unknown'] },
              total: 1,
              count: 1,
            },
          },
        ]),
      ),
      timedStage('purchasesByMonth', ctx, () =>
        PurchaseModel.aggregate([
          { $match: purchaseMatch },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$billDate' } },
              total: { $sum: '$grandTotal' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
          { $project: { month: '$_id', total: 1, count: 1, _id: 0 } },
        ]),
      ),
      timedStage('topVendors', ctx, () =>
        PurchaseModel.aggregate([
          { $match: { ...purchaseMatch, vendor: { $exists: true, $ne: null } } },
          { $group: { _id: '$vendor', total: { $sum: '$grandTotal' } } },
          { $sort: { total: -1 } },
          { $limit: 10 },
          {
            $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' },
          },
          { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              vendorId: '$_id',
              vendorName: { $ifNull: ['$vendor.name', 'Unknown'] },
              total: 1,
            },
          },
        ]),
      ),
      timedStage('lowStock', ctx, () => getLowStock(tender, selectedTender)),
      timedStage('labourExpenses', ctx, () =>
        labourExpenseSvc.getSummaryStats(
          normalizedDates.dateFrom,
          normalizedDates.dateTo,
          tender,
        ),
      ),
      timedStage('salaryExpenses', ctx, () => employeeSvc.getTenderExpenseSummary(tender)),
    ]);

    const { tenderStats, statusCounts, expiringBgs } = tenderSection;
    const selectedProgress =
      'selected' in tenderSection ? (tenderSection.selected?.progress ?? 0) : 0;

    const stats = purchaseStats[0] ?? {
      totalCount: 0,
      totalGrandValue: 0,
      totalGst: 0,
      totalFreightLabour: 0,
    };

    const tenderAgg = tenderStats[0] ?? {
      totalOrderValue: 0,
      totalOutstanding: 0,
      activeOrderValue: 0,
    };
    const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const salaryExpenses = buildSalaryExpenseStats(salaryExpenseSummary, tender);

    const result = {
      purchases: {
        totalCount: stats.totalCount,
        totalGrandValue: stats.totalGrandValue,
        totalGst: stats.totalGst,
        totalFreightLabour: stats.totalFreightLabour,
        bySite: bySite.map((s) => ({
          siteId: s.siteId?.toString() ?? '',
          siteName: s.siteName,
          total: s.total,
          count: s.count,
        })),
        byMonth,
        topVendors: topVendors
          .filter((v) => v.vendorId != null)
          .map((v) => ({
            vendorId: v.vendorId.toString(),
            vendorName: v.vendorName,
            total: v.total,
          })),
      },
      tenders: {
        totalOrderValue: tenderAgg.totalOrderValue,
        activeOrderValue: tenderAgg.activeOrderValue ?? 0,
        totalOutstanding: tenderAgg.totalOutstanding,
        activeCount: statusMap[TenderStatus.ACTIVE] ?? 0,
        completedCount: statusMap[TenderStatus.COMPLETED] ?? 0,
        pendingCount: statusMap[TenderStatus.PENDING] ?? 0,
        expiredCount: statusMap[TenderStatus.EXPIRED] ?? 0,
        cancelledCount: statusMap[TenderStatus.CANCELLED] ?? 0,
        expiringBgs: expiringBgs
          .filter((t) => t._id && t.bgExpiryDate)
          .map((t) => ({
            _id: t._id.toString(),
            tenderName: t.tenderName,
            tenderNo: t.tenderNo,
            bgNumber: t.bgNumber,
            bgExpiryDate: t.bgExpiryDate!.toISOString(),
            daysUntilExpiry: Math.ceil(
              (t.bgExpiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            ),
          })),
        progress: selectedProgress,
      },
      labourExpenses: {
        totalAmount: labourExpenses.totalAmount,
        totalCount: labourExpenses.totalCount,
        bySite: labourExpenses.bySite,
        recent: labourExpenses.recent.map((e) => ({
          _id: e._id.toString(),
          tender: e.tender as never,
          site: e.site as never,
          siteNameRaw: e.siteNameRaw,
          amount: e.amount,
          expenseDate: e.expenseDate,
          description: e.description ?? e.notes,
        })),
      },
      salaryExpenses,
      inventory: {
        lowStock: lowStock.map((s) => {
          const item = s.item as { _id?: string; name?: string };
          const site = s.site as { _id?: string; name?: string };
          return {
            itemId: item?._id?.toString?.() ?? '',
            itemName: item?.name ?? 'Unknown',
            siteId: site?._id?.toString?.() ?? '',
            siteName: site?.name ?? 'Unknown',
            quantity: s.quantity,
          };
        }),
      },
    };

    logger.info(`${SUMMARY_LOG} request ok`, {
      ...ctx,
      durationMs: Date.now() - startedAt,
      purchaseCount: result.purchases.totalCount,
      lowStockCount: result.inventory.lowStock.length,
      expiringBgCount: result.tenders.expiringBgs.length,
    });

    return result;
  } catch (err) {
    logger.error(`${SUMMARY_LOG} request failed`, {
      ...ctx,
      durationMs: Date.now() - startedAt,
      errorName: err instanceof Error ? err.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}
