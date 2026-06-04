export interface LabourExpense {
  _id: string;
  tender: string;
  site?: string;
  siteNameRaw: string;
  amount: number;
  expenseDate: string | Date;
  description?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LabourExpensePopulated extends Omit<LabourExpense, 'tender' | 'site' | 'createdBy'> {
  tender: { _id: string; tenderName: string; tenderNo: string };
  site?: { _id: string; name: string; code: string };
  createdBy: { _id: string; name: string };
}
