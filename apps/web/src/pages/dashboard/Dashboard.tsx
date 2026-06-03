import { useState } from 'react';
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
import { IndianRupee, Receipt, FileText, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { PageWrapper } from '@/layouts/PageWrapper';
import { StatCard } from '@/components/StatCard';
import { Spinner } from '@/components/Spinner';
import { Input } from '@/components/Input';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const PIE_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#64748B'];

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dateFrom, dateTo],
    queryFn: () =>
      dashboardApi.summary({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }),
  });

  const tenderPie = data
    ? [
        { name: 'Active', value: data.tenders.activeCount },
        { name: 'Completed', value: data.tenders.completedCount },
        { name: 'Pending', value: data.tenders.pendingCount },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <PageWrapper
      title="Dashboard"
      actions={
        <div className="hidden items-center gap-2 sm:flex">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="!w-auto" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="!w-auto" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              title="Active Tenders"
              value={formatNumber(data.tenders.activeCount)}
              subtitle={formatCurrency(data.tenders.totalOrderValue) + ' order value'}
              icon={FileText}
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
