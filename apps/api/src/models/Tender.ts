import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { TenderStatus } from '@gupta/shared';
import type { IAttachment } from './Purchase.js';

export interface ITenderSite {
  _id?: Types.ObjectId;
  site?: Types.ObjectId;
  siteNameRaw: string;
}

export interface ITender extends Document {
  serialNo: number;
  code: string;
  tenderName: string;
  tenderNo: string;
  uniqueId?: string;
  orderValue: number;
  emd: number;
  pg: number;
  sdFromBill: number;
  paymentReceivedTillDate: number;
  paymentOutstanding: number;
  executionPending: number;
  workCompleted: number;
  bgNumber?: string;
  bgExpiryDate?: Date;
  fdrNumber?: string;
  fdrExpiryDate?: Date;
  progress: number;
  status: TenderStatus;
  sites: ITenderSite[];
  notes?: string;
  attachments: IAttachment[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const tenderSiteSchema = new Schema<ITenderSite>(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    siteNameRaw: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const tenderSchema = new Schema<ITender>(
  {
    serialNo: { type: Number, required: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true },
    tenderName: { type: String, required: true, trim: true },
    tenderNo: { type: String, required: true, trim: true },
    uniqueId: { type: String, trim: true },
    orderValue: { type: Number, default: 0 },
    emd: { type: Number, default: 0 },
    pg: { type: Number, default: 0 },
    sdFromBill: { type: Number, default: 0 },
    paymentReceivedTillDate: { type: Number, default: 0 },
    paymentOutstanding: { type: Number, default: 0 },
    executionPending: { type: Number, default: 0 },
    workCompleted: { type: Number, default: 0 },
    bgNumber: { type: String, trim: true },
    bgExpiryDate: { type: Date },
    fdrNumber: { type: String, trim: true },
    fdrExpiryDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: Object.values(TenderStatus),
      default: TenderStatus.PENDING,
    },
    sites: {
      type: [tenderSiteSchema],
      default: [],
      validate: [(v: ITenderSite[]) => v.length > 0, 'At least one site is required'],
    },
    notes: { type: String },
    attachments: [attachmentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

tenderSchema.index({ status: 1 });
tenderSchema.index({ tenderName: 'text', tenderNo: 'text', code: 'text', 'sites.siteNameRaw': 'text' });
tenderSchema.index({ bgExpiryDate: 1 });
tenderSchema.index({ fdrExpiryDate: 1 });

export const TenderModel = mongoose.model<ITender>('Tender', tenderSchema);

export async function getNextTenderSerial(): Promise<number> {
  const last = await TenderModel.findOne().sort({ serialNo: -1 }).select('serialNo').lean();
  return (last?.serialNo ?? 0) + 1;
}
