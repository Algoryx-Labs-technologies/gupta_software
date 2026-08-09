import type { Attachment } from './common.js';

export interface Loa {
  _id: string;
  serialNo: number;
  loaNumber: string;
  loaDate: string | Date;
  title?: string;
  tender?: string;
  notes?: string;
  attachments: Attachment[];
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LoaPopulated
  extends Omit<Loa, 'tender' | 'createdBy'> {
  tender?: { _id: string; tenderName: string; tenderNo: string; code?: string } | null;
  createdBy?: { _id: string; name: string };
}
