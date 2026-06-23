import { VendorModel, getNextVendorSerial } from '../../models/Vendor.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatEntityCode } from '../../utils/entityCode.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';
import type { CreateVendorInput, UpdateVendorInput } from '@gupta/shared';

export async function list(page: number, limit: number, search?: string) {
  const { skip } = getPagination(page, limit);
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }] }
    : {};

  const [data, total] = await Promise.all([
    VendorModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    VendorModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function create(input: CreateVendorInput) {
  const serialNo = await getNextVendorSerial();
  const code = formatEntityCode('VEN', serialNo);
  return VendorModel.create({ ...input, serialNo, code });
}

export async function getById(id: string) {
  const vendor = await VendorModel.findById(id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
}

export async function update(id: string, input: UpdateVendorInput) {
  const vendor = await VendorModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
}

export async function remove(id: string) {
  const vendor = await VendorModel.findByIdAndDelete(id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
}

export async function search(query: string, limit = 20) {
  return VendorModel.find({
    $or: [{ name: new RegExp(query, 'i') }, { code: new RegExp(query, 'i') }],
  })
    .limit(limit)
    .select('name code gstin phone')
    .lean();
}
