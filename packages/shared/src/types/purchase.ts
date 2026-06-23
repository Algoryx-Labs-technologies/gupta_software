import type { Attachment } from './common.js';

export interface PurchaseItem {
  _id?: string;
  itemDescription: string;
  item?: string;
  category?: string;
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

export interface Purchase {
  _id: string;
  serialNo: number;
  vendor: string;
  vendorNameRaw: string;
  tender?: string;
  billDate: string | Date;
  billNo: string;
  billName?: string;
  site: string;
  siteNameRaw: string;
  items: PurchaseItem[];
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  notes?: string;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PurchasePopulated extends Omit<Purchase, 'vendor' | 'site' | 'tender' | 'createdBy' | 'items'> {
  vendor: { _id: string; name: string };
  tender?: { _id: string; tenderName: string; tenderNo: string };
  site: { _id: string; name: string; code: string };
  items: Array<
    Omit<PurchaseItem, 'item' | 'category'> & {
      item?: { _id: string; name: string };
      category?: { _id: string; name: string; code: string };
    }
  >;
  createdBy: { _id: string; name: string };
}
