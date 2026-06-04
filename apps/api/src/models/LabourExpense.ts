import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ILabourExpense extends Document {
  tender: Types.ObjectId;
  site?: Types.ObjectId;
  siteNameRaw: string;
  amount: number;
  expenseDate: Date;
  description?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const labourExpenseSchema = new Schema<ILabourExpense>(
  {
    tender: { type: Schema.Types.ObjectId, ref: 'Tender', required: true },
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    siteNameRaw: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

labourExpenseSchema.index({ expenseDate: -1 });
labourExpenseSchema.index({ tender: 1, expenseDate: -1 });
labourExpenseSchema.index({ site: 1, expenseDate: -1 });

export const LabourExpenseModel = mongoose.model<ILabourExpense>('LabourExpense', labourExpenseSchema);
