import mongoose, { Schema, type Document } from 'mongoose';

export interface ISite extends Document {
  name: string;
  code: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    location: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

siteSchema.index({ name: 'text', code: 'text' });

export const SiteModel = mongoose.model<ISite>('Site', siteSchema);
