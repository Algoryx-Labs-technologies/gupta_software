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
    totalOutstanding: number;
    activeCount: number;
    completedCount: number;
    pendingCount: number;
    expiringBgs: {
      _id: string;
      tenderName: string;
      tenderNo: string;
      bgNumber?: string;
      bgExpiryDate: string;
      daysUntilExpiry: number;
    }[];
  };
  inventory?: {
    lowStock: { itemId: string; itemName: string; siteId: string; siteName: string; quantity: number }[];
  };
}
