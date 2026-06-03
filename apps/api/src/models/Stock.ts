import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IStock extends Document {
  item: Types.ObjectId;
  site: Types.ObjectId;
  quantity: number;
  specification?: string;
  unit?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    specification: { type: String, default: '', trim: true },
    unit: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

stockSchema.index({ item: 1, site: 1, specification: 1 }, { unique: true });

export const StockModel = mongoose.model<IStock>('Stock', stockSchema);
