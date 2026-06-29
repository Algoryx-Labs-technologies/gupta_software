import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IOutstandingPayment extends Document {
  tender: Types.ObjectId;
  site?: Types.ObjectId;
  siteNameRaw: string;
  amount: number;
  paymentDate: Date;
  description?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const outstandingPaymentSchema = new Schema<IOutstandingPayment>(
  {
    tender: { type: Schema.Types.ObjectId, ref: 'Tender', required: true },
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    siteNameRaw: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

outstandingPaymentSchema.index({ paymentDate: -1 });
outstandingPaymentSchema.index({ tender: 1, paymentDate: -1 });
outstandingPaymentSchema.index({ site: 1, paymentDate: -1 });

export const OutstandingPaymentModel = mongoose.model<IOutstandingPayment>(
  'OutstandingPayment',
  outstandingPaymentSchema,
);
