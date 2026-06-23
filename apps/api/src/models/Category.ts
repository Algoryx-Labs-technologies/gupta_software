import mongoose, { Schema, type Document } from 'mongoose';

export interface ICategory extends Document {
  serialNo: number;
  code: string;
  name: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    serialNo: { type: Number, required: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

categorySchema.index({ name: 'text', code: 'text' });

export const CategoryModel = mongoose.model<ICategory>('Category', categorySchema);

export async function getNextCategorySerial(): Promise<number> {
  const last = await CategoryModel.findOne().sort({ serialNo: -1 }).select('serialNo').lean();
  return (last?.serialNo ?? 0) + 1;
}
