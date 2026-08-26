import { VendorModel } from '../models/Vendor.js';
import { TenderModel } from '../models/Tender.js';
import { LabourExpenseModel } from '../models/LabourExpense.js';
import { LabourExpenseCategory } from '@gupta/shared';
import { formatEntityCode } from './entityCode.js';
import { logger } from './logger.js';

export async function backfillEntityCodes(): Promise<void> {
  await backfillVendorCodes();
  await backfillTenderCodes();
  await backfillLabourExpenseCategories();
}

async function backfillLabourExpenseCategories(): Promise<void> {
  const result = await LabourExpenseModel.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }, { category: '' }] },
    { $set: { category: LabourExpenseCategory.OTHER } },
  );
  if (result.modifiedCount > 0) {
    logger.info(`Backfilled category on ${result.modifiedCount} labour expense(s)`);
  }
}

async function backfillVendorCodes(): Promise<void> {
  const missing = await VendorModel.find({
    $or: [{ code: { $exists: false } }, { code: null }, { code: '' }],
  })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();

  if (!missing.length) return;

  const last = await VendorModel.findOne({ serialNo: { $exists: true, $ne: null } })
    .sort({ serialNo: -1 })
    .select('serialNo')
    .lean();
  let nextSerial = last?.serialNo ?? 0;

  for (const vendor of missing) {
    nextSerial += 1;
    await VendorModel.updateOne(
      { _id: vendor._id },
      { serialNo: nextSerial, code: formatEntityCode('VEN', nextSerial) },
    );
  }

  console.log(`Backfilled codes for ${missing.length} vendor(s)`);
}

async function backfillTenderCodes(): Promise<void> {
  const missing = await TenderModel.find({
    $or: [{ code: { $exists: false } }, { code: null }, { code: '' }],
  })
    .select('_id serialNo')
    .lean();

  if (!missing.length) return;

  for (const tender of missing) {
    if (!tender.serialNo) continue;
    await TenderModel.updateOne(
      { _id: tender._id },
      { code: formatEntityCode('TND', tender.serialNo) },
    );
  }

  console.log(`Backfilled codes for ${missing.length} tender(s)`);
}
