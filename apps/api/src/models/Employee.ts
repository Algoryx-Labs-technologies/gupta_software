import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { EmployeeAssignmentStatus } from '@gupta/shared';

export interface IEmployeeTenderHistory {
  _id?: Types.ObjectId;
  tender: Types.ObjectId;
  daysWorked: number;
  assignedAt: Date;
  endedAt: Date;
}

export interface IEmployee extends Document {
  name: string;
  phone: string;
  employeeId: string;
  salary: number;
  status: EmployeeAssignmentStatus;
  currentTender?: Types.ObjectId;
  currentDaysWorked: number;
  assignedAt?: Date;
  tenderHistory: IEmployeeTenderHistory[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tenderHistorySchema = new Schema<IEmployeeTenderHistory>(
  {
    tender: { type: Schema.Types.ObjectId, ref: 'Tender', required: true },
    daysWorked: { type: Number, required: true, min: 0 },
    assignedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { _id: true },
);

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    salary: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(EmployeeAssignmentStatus),
      default: EmployeeAssignmentStatus.UNASSIGNED,
    },
    currentTender: { type: Schema.Types.ObjectId, ref: 'Tender' },
    currentDaysWorked: { type: Number, default: 0, min: 0 },
    assignedAt: { type: Date },
    tenderHistory: { type: [tenderHistorySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

employeeSchema.index({ name: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ currentTender: 1 });

export const EmployeeModel = mongoose.model<IEmployee>('Employee', employeeSchema);

export const DAYS_IN_MONTH = 30;

export function dailyRate(monthlySalary: number): number {
  return monthlySalary / DAYS_IN_MONTH;
}

export function calculateExpense(monthlySalary: number, daysWorked: number): number {
  return dailyRate(monthlySalary) * daysWorked;
}
