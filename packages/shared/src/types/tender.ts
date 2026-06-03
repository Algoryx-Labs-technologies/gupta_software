import type { TenderStatus } from '../enums.js';
import type { Attachment } from './common.js';

export interface Tender {
  _id: string;
  serialNo: number;
  tenderName: string;
  tenderNo: string;
  orderValue: number;
  emd: number;
  pg: number;
  sdFromBill: number;
  paymentReceivedTillDate: number;
  paymentOutstanding: number;
  executionPending: number;
  workCompleted: number;
  bgNumber?: string;
  bgExpiryDate?: string | Date;
  status: TenderStatus;
  notes?: string;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
