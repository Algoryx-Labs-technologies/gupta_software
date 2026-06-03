import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  userRef?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    userRef: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });

export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
