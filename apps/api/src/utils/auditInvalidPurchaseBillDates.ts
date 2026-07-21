import { MONGO_MAX_DATE, MONGO_MIN_DATE } from '@gupta/shared';
import { PurchaseModel } from '../models/Purchase.js';
import { logger } from './logger.js';

/**
 * Logs purchases whose billDate is outside MongoDB's supported range.
 * Does not mutate data; operators can correct records manually.
 */
export async function auditInvalidPurchaseBillDates(): Promise<void> {
  const invalidFilter = {
    $or: [
      { billDate: { $lt: MONGO_MIN_DATE } },
      { billDate: { $gt: MONGO_MAX_DATE } },
    ],
  };

  const count = await PurchaseModel.countDocuments(invalidFilter);
  if (count === 0) return;

  const samples = await PurchaseModel.find(invalidFilter)
    .select('_id billDate tender billNo vendorNameRaw')
    .limit(5)
    .lean();

  logger.warn('Purchases with out-of-range billDate detected', {
    count,
    samples: samples.map((row) => ({
      id: row._id.toString(),
      billDate: row.billDate?.toISOString?.() ?? row.billDate,
      tender: row.tender?.toString() ?? null,
      billNo: row.billNo,
      vendorNameRaw: row.vendorNameRaw,
    })),
  });
}
