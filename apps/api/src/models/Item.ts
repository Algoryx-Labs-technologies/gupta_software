import mongoose, { Schema, type Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  category?: string;
  specification?: string;
  defaultUnit?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    specification: { type: String, trim: true },
    defaultUnit: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

itemSchema.index({ name: 'text', category: 'text' });

export const ItemModel = mongoose.model<IItem>('Item', itemSchema);
