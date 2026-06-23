import type { TenderStatus } from '../enums.js';
import type { Attachment } from './common.js';

export interface TenderSite {
  _id?: string;
  site?: string;
  siteNameRaw: string;
}

export interface Tender {
  _id: string;
  serialNo: number;
  code: string;
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
  sites: TenderSite[];
  notes?: string;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TenderPopulated extends Omit<Tender, 'createdBy' | 'sites'> {
  sites: Array<
    Omit<TenderSite, 'site'> & {
      site?: { _id: string; name: string; code: string };
    }
  >;
  createdBy: { _id: string; name: string };
}
