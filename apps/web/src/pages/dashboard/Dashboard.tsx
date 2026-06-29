import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { IndianRupee, Receipt, FileText, AlertTriangle, Wallet } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { tendersApi } from '@/api/tenders';
import { PageWrapper } from '@/layouts/PageWrapper';
import { StatCard } from '@/components/StatCard';
import { Spinner } from '@/components/Spinner';
import { Select } from '@/components/Input';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const PIE_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#64748B'];

export default function DashboardPage() {
  const [tenderId, setTenderId] = useState('');

  const { data: tendersData } = useQuery({
    queryKey: ['tenders', 'dashboard-filter'],
    queryFn: () => tendersApi.list({ limit: 100, sortBy: 'tenderName', sortOrder: 'asc' }),
  });

  const tenderOptions = useMemo(
    () => [
      { value: '', label: 'All tenders' },
      ...(tendersData?.data ?? []).map((t) => ({
        value: t._id,
        label: `${t.tenderNo} — ${t.tenderName}`,
      })),
    ],
    [tendersData],
  );

  const selectedTenderLabel = tenderOptions.find((t) => t.value === tenderId)?.label;

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', tenderId],
    queryFn: () =>
      dashboardApi.summary({
        ...(tenderId && { tender: tenderId }),
      }),
  });

  const tenderPie = data
    ? [
        { name: 'Active', value: data.tenders.activeCount },
        { name: 'Completed', value: data.tenders.completedCount },
        { name: 'Pending', value: data.tenders.pendingCount },
        { name: 'Expired', value: data.tenders.expiredCount },
        { name: 'Cancelled', value: data.tenders.cancelledCount },
      ].filter((d) => d.value > 0)
    : [];

  const filters = (
    <Select
      label="Tender"
      options={tenderOptions}
      value={tenderId}
      onChange={(e) => setTenderId(e.target.value)}
      className="!w-auto min-w-[200px]"
    />
  );

  return (
    <PageWrapper title="Dashboard" actions={filters}>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {tenderId && selectedTenderLabel && (
            <p className="text-sm text-muted">
              Showing stats for <span className="font-medium text-gray-700">{selectedTenderLabel}</span>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Total Purchase Value"
              value={formatCurrency(data.purchases.totalGrandValue)}
              subtitle={`${formatNumber(data.purchases.totalCount)} bills`}
              icon={IndianRupee}
              accent
            />
            <StatCard
              title="Total GST"
              value={formatCurrency(data.purchases.totalGst)}
              icon={Receipt}
            />
            <StatCard
              title={tenderId ? 'Tender Order Value' : 'Active Tenders'}
              value={
                tenderId
                  ? formatCurrency(data.tenders.totalOrderValue)
                  : formatNumber(data.tenders.activeCount)
              }
              subtitle={
                tenderId
                  ? selectedTenderLabel
                  : formatCurrency(data.tenders.activeOrderValue) + ' active order value'
              }
              icon={FileText}
            />
            <StatCard
              title="Labour Expense"
              value={formatCurrency(data.labourExpenses.totalAmount)}
              subtitle={`${formatNumber(data.labourExpenses.totalCount)} entries`}
              icon={IndianRupee}
            />
            <StatCard
              title="Salary Expense"
              value={formatCurrency(data.salaryExpenses.totalAmount)}
              subtitle={`${formatNumber(data.salaryExpenses.totalDays)} days · ${formatNumber(data.salaryExpenses.employeeCount)} assignments`}
              icon={Wallet}
            />
            <StatCard
              title="Outstanding Payments"
              value={formatCurrency(data.tenders.totalOutstanding)}
              subtitle={`${data.tenders.expiringBgs.length} BGs expiring soon`}
              icon={AlertTriangle}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 font-semibold">Monthly Purchases</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.purchases.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E3DC" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold">Tender Status</h3>
              {tenderPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={tenderPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {tenderPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted">No tender data</p>
              )}
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold">Top Sites by Spend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.purchases.bySite} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E3DC" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="siteName" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#4F7DF3" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold">Top Vendors</h3>
              <div className="space-y-3">
                {data.purchases.topVendors.map((v, i) => (
                  <div key={v.vendorId} className="flex items-center justify-between">
                    <span className="text-sm">
                      {i + 1}. {v.vendorName}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(v.total)}</span>
                  </div>
                ))}
                {data.purchases.topVendors.length === 0 && (
                  <p className="text-sm text-muted">No vendor data</p>
                )}
              </div>
            </div>

            {!tenderId && data.salaryExpenses.byTender.length > 0 && (
              <div className="card">
                <h3 className="mb-4 font-semibold">Salary Expense by Tender</h3>
                <div className="space-y-3">
                  {data.salaryExpenses.byTender.map((row, i) => (
                    <div key={row.tenderId} className="flex items-center justify-between gap-2">
                      <span className="text-sm">
                        {i + 1}. {row.tenderNo} — {row.tenderName}
                      </span>
                      <span className="text-sm font-medium">{formatCurrency(row.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {data.tenders.expiringBgs.length > 0 && (
            <div className="card border-amber-200 bg-amber-50/50">
              <h3 className="mb-3 font-semibold text-amber-800">Bank Guarantees Expiring (60 days)</h3>
              <div className="space-y-2">
                {data.tenders.expiringBgs.map((bg) => (
                  <div key={bg._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {bg.tenderName} ({bg.tenderNo})
                    </span>
                    <span className="font-medium text-amber-700">
                      {bg.daysUntilExpiry} days · BG: {bg.bgNumber || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </PageWrapper>
  );
}
