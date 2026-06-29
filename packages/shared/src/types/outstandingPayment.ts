export interface OutstandingPayment {
  _id: string;
  tender: string;
  site?: string;
  siteNameRaw: string;
  amount: number;
  paymentDate: string | Date;
  description?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OutstandingPaymentPopulated
  extends Omit<OutstandingPayment, 'tender' | 'site' | 'createdBy'> {
  tender: { _id: string; tenderName: string; tenderNo: string } | null;
  site?: { _id: string; name: string; code: string };
  createdBy?: { _id: string; name: string };
}
