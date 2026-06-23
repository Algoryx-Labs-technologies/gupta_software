import { VendorModel } from '../models/Vendor.js';
import { TenderModel } from '../models/Tender.js';
import { formatEntityCode } from './entityCode.js';

export async function backfillEntityCodes(): Promise<void> {
  await backfillVendorCodes();
  await backfillTenderCodes();
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
