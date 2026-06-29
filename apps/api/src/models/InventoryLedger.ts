import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { InventoryDirection, InventoryMovementType } from '@gupta/shared';

export interface IInventoryLedger extends Document {
  movementType: InventoryMovementType;
  direction: InventoryDirection;
  item?: Types.ObjectId;
  itemDescription: string;
  category?: Types.ObjectId;
  categoryNameRaw?: string;
  unit?: string;
  site: Types.ObjectId;
  quantity: number;
  fromSite?: Types.ObjectId;
  toSite?: Types.ObjectId;
  purchaseId?: Types.ObjectId;
  purchaseItemId?: string;
  purchaseSerialNo?: number;
  billNo?: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryLedgerSchema = new Schema<IInventoryLedger>(
  {
    movementType: {
      type: String,
      enum: Object.values(InventoryMovementType),
      required: true,
    },
    direction: {
      type: String,
      enum: Object.values(InventoryDirection),
      required: true,
    },
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    itemDescription: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    categoryNameRaw: { type: String, trim: true },
    unit: { type: String, trim: true },
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    quantity: { type: Number, required: true, min: 0 },
    fromSite: { type: Schema.Types.ObjectId, ref: 'Site' },
    toSite: { type: Schema.Types.ObjectId, ref: 'Site' },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase' },
    purchaseItemId: { type: String },
    purchaseSerialNo: { type: Number },
    billNo: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

inventoryLedgerSchema.index({ site: 1, item: 1, itemDescription: 1 });
inventoryLedgerSchema.index({ purchaseId: 1, purchaseItemId: 1 });
inventoryLedgerSchema.index({ createdAt: -1 });

export const InventoryLedgerModel = mongoose.model<IInventoryLedger>(
  'InventoryLedger',
  inventoryLedgerSchema,
);
