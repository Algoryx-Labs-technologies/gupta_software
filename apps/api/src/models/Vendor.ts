import mongoose, { Schema, type Document } from 'mongoose';

export interface IVendor extends Document {
  serialNo: number;
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    serialNo: { type: Number, required: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gstin: { type: String, trim: true },
    address: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

vendorSchema.index({ name: 'text', code: 'text' });

export const VendorModel = mongoose.model<IVendor>('Vendor', vendorSchema);

export async function getNextVendorSerial(): Promise<number> {
  const last = await VendorModel.findOne().sort({ serialNo: -1 }).select('serialNo').lean();
  return (last?.serialNo ?? 0) + 1;
}
