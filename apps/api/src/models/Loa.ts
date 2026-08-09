import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ILoaAttachment {
  _id?: Types.ObjectId;
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface ILoa extends Document {
  serialNo: number;
  loaNumber: string;
  loaDate: Date;
  title?: string;
  tender?: Types.ObjectId;
  notes?: string;
  attachments: ILoaAttachment[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const loaAttachmentSchema = new Schema<ILoaAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const loaSchema = new Schema<ILoa>(
  {
    serialNo: { type: Number, required: true, unique: true },
    loaNumber: { type: String, required: true, trim: true },
    loaDate: { type: Date, required: true },
    title: { type: String, trim: true, maxlength: 200 },
    tender: { type: Schema.Types.ObjectId, ref: 'Tender' },
    notes: { type: String, trim: true, maxlength: 500 },
    attachments: { type: [loaAttachmentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

loaSchema.index({ loaDate: -1 });
loaSchema.index({ serialNo: -1 });
loaSchema.index({ tender: 1, loaDate: -1 });
loaSchema.index({ loaNumber: 'text', title: 'text', notes: 'text' });

export const LoaModel = mongoose.model<ILoa>('Loa', loaSchema);

export async function getNextLoaSerial(): Promise<number> {
  const last = await LoaModel.findOne().sort({ serialNo: -1 }).select('serialNo').lean();
  return (last?.serialNo ?? 0) + 1;
}
