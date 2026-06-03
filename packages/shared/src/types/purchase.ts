import type { Attachment } from './common.js';

export interface Purchase {
  _id: string;
  serialNo: number;
  vendor: string;
  vendorNameRaw: string;
  itemDescription: string;
  item?: string;
  billDate: string | Date;
  billNo: string;
  site: string;
  siteNameRaw: string;
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
  notes?: string;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PurchasePopulated extends Omit<Purchase, 'vendor' | 'site' | 'item' | 'createdBy'> {
  vendor: { _id: string; name: string };
  site: { _id: string; name: string; code: string };
  item?: { _id: string; name: string };
  createdBy: { _id: string; name: string };
}
