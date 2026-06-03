import mongoose, { Schema, type Document } from 'mongoose';

export interface IVendor extends Document {
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

vendorSchema.index({ name: 'text' });

export const VendorModel = mongoose.model<IVendor>('Vendor', vendorSchema);
