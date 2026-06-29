export interface DashboardSummary {
  purchases: {
    totalCount: number;
    totalGrandValue: number;
    totalGst: number;
    totalFreightLabour: number;
    bySite: { siteId: string; siteName: string; total: number; count: number }[];
    byMonth: { month: string; total: number; count: number }[];
    topVendors: { vendorId: string; vendorName: string; total: number }[];
  };
  tenders: {
    totalOrderValue: number;
    activeOrderValue: number;
    totalOutstanding: number;
    activeCount: number;
    completedCount: number;
    pendingCount: number;
    expiredCount: number;
    cancelledCount: number;
    expiringBgs: {
      _id: string;
      tenderName: string;
      tenderNo: string;
      bgNumber?: string;
      bgExpiryDate: string;
      daysUntilExpiry: number;
    }[];
  };
  labourExpenses: {
    totalAmount: number;
    totalCount: number;
    bySite: { siteName: string; total: number; count: number }[];
    recent: {
      _id: string;
      tender: { _id: string; tenderName: string; tenderNo: string } | string;
      site?: { _id: string; name: string; code: string } | string;
      siteNameRaw: string;
      amount: number;
      expenseDate: string | Date;
      description?: string;
    }[];
  };
  salaryExpenses: {
    totalAmount: number;
    totalDays: number;
    employeeCount: number;
    byTender: {
      tenderId: string;
      tenderName: string;
      tenderNo: string;
      total: number;
      totalDays: number;
    }[];
  };
  inventory?: {
    lowStock: { itemId: string; itemName: string; siteId: string; siteName: string; quantity: number }[];
  };
}
