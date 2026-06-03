import { TenderStatus } from '@gupta/shared';
import { PurchaseModel } from '../../models/Purchase.js';
import { TenderModel } from '../../models/Tender.js';
import { StockModel } from '../../models/Stock.js';

export async function getSummary(dateFrom?: Date, dateTo?: Date) {
  const purchaseMatch: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    purchaseMatch.billDate = {};
    if (dateFrom) (purchaseMatch.billDate as Record<string, Date>).$gte = dateFrom;
    if (dateTo) (purchaseMatch.billDate as Record<string, Date>).$lte = dateTo;
  }

  const [
    purchaseStats,
    bySite,
    byMonth,
    topVendors,
    tenderStats,
    statusCounts,
    expiringBgs,
    lowStock,
  ] = await Promise.all([
    PurchaseModel.aggregate([
      { $match: purchaseMatch },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalGrandValue: { $sum: '$grandTotal' },
          totalGst: { $sum: '$gstAmount' },
          totalFreightLabour: { $sum: { $add: ['$freight', '$labour'] } },
        },
      },
    ]),
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
    PurchaseModel.aggregate([
      { $match: { ...purchaseMatch, vendor: { $exists: true, $ne: null } } },
      { $group: { _id: '$vendor', total: { $sum: '$grandTotal' } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' },
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendorId: '$_id',
          vendorName: '$vendor.name',
          total: 1,
        },
      },
    ]),
    TenderModel.aggregate([
      {
        $group: {
          _id: null,
          totalOrderValue: { $sum: '$orderValue' },
          totalOutstanding: { $sum: '$paymentOutstanding' },
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
    StockModel.find({ quantity: { $lte: 5 } })
      .populate('item', 'name')
      .populate('site', 'name')
      .limit(20)
      .lean(),
  ]);

  const stats = purchaseStats[0] ?? {
    totalCount: 0,
    totalGrandValue: 0,
    totalGst: 0,
    totalFreightLabour: 0,
  };

  const tenderAgg = tenderStats[0] ?? { totalOrderValue: 0, totalOutstanding: 0 };
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

  return {
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
      topVendors: topVendors.map((v) => ({
        vendorId: v.vendorId.toString(),
        vendorName: v.vendorName,
        total: v.total,
      })),
    },
    tenders: {
      totalOrderValue: tenderAgg.totalOrderValue,
      totalOutstanding: tenderAgg.totalOutstanding,
      activeCount: statusMap[TenderStatus.ACTIVE] ?? 0,
      completedCount: statusMap[TenderStatus.COMPLETED] ?? 0,
      pendingCount: statusMap[TenderStatus.PENDING] ?? 0,
      expiringBgs: expiringBgs.map((t) => ({
        _id: t._id.toString(),
        tenderName: t.tenderName,
        tenderNo: t.tenderNo,
        bgNumber: t.bgNumber,
        bgExpiryDate: t.bgExpiryDate!.toISOString(),
        daysUntilExpiry: Math.ceil(
          (t.bgExpiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      })),
    },
    inventory: {
      lowStock: lowStock.map((s) => {
        const item = s.item as unknown as { _id?: { toString(): string }; name?: string } | null;
        const site = s.site as unknown as { _id?: { toString(): string }; name?: string } | null;
        return {
          itemId: item?._id?.toString?.() ?? String(s.item),
          itemName: item?.name ?? 'Unknown',
          siteId: site?._id?.toString?.() ?? String(s.site),
          siteName: site?.name ?? 'Unknown',
          quantity: s.quantity,
        };
      }),
    },
  };
}
