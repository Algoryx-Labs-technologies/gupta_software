import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { Role } from '@gupta/shared';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  disabled: boolean;
  lastLoginAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    disabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
