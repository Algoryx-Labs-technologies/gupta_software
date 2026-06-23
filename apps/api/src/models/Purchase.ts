import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAttachment {
  _id?: Types.ObjectId;
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface IPurchaseItem {
  _id?: Types.ObjectId;
  itemDescription: string;
  item?: Types.ObjectId;
  category?: Types.ObjectId;
  categoryNameRaw?: string;
  qty?: number;
  unit?: string;
  perRate?: number;
  freight: number;
  labour: number;
  subTotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  isHmPurchase: boolean;
}

export interface IPurchase extends Document {
  serialNo: number;
  vendor?: Types.ObjectId;
  vendorNameRaw: string;
  tender?: Types.ObjectId;
  billDate: Date;
  billNo: string;
  billName: string;
  site?: Types.ObjectId;
  siteNameRaw: string;
  items: IPurchaseItem[];
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
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

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    itemDescription: { type: String, required: true, trim: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    categoryNameRaw: { type: String, trim: true },
    qty: { type: Number },
    unit: { type: String, trim: true },
    perRate: { type: Number },
    freight: { type: Number, default: 0 },
    labour: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    isHmPurchase: { type: Boolean, default: false },
  },
  { _id: true },
);

const purchaseSchema = new Schema<IPurchase>(
  {
    serialNo: { type: Number, required: true, unique: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    vendorNameRaw: { type: String, required: true, trim: true },
    tender: { type: Schema.Types.ObjectId, ref: 'Tender' },
    billDate: { type: Date, required: true },
    billNo: { type: String, required: true, trim: true },
    billName: { type: String, trim: true, default: '' },
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    siteNameRaw: { type: String, required: true, trim: true },
    items: { type: [purchaseItemSchema], required: true, validate: [(v: IPurchaseItem[]) => v.length > 0, 'At least one item is required'] },
    subTotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    notes: { type: String },
    attachments: [attachmentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

purchaseSchema.index({ billDate: -1 });
purchaseSchema.index({ site: 1, billDate: -1 });
purchaseSchema.index({ vendor: 1 });
purchaseSchema.index({ tender: 1 });
purchaseSchema.index({ billNo: 'text', billName: 'text', vendorNameRaw: 'text', 'items.itemDescription': 'text' });

export const PurchaseModel = mongoose.model<IPurchase>('Purchase', purchaseSchema);

export async function getNextPurchaseSerial(): Promise<number> {
  const last = await PurchaseModel.findOne().sort({ serialNo: -1 }).select('serialNo').lean();
  return (last?.serialNo ?? 0) + 1;
}
