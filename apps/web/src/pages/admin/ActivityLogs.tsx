import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import type { ActivityLog } from '@gupta/shared';
import { activityApi } from '@/api/dashboard';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DataTable, type Column } from '@/components/DataTable';
import { formatDate, formatTime } from '@/lib/formatters';
import { exportToExcel } from '@/lib/exportToExcel';

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, search],
    queryFn: () => activityApi.list({ page, limit: 30, search: search || undefined }),
  });

  const columns: Column<ActivityLog>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'time',
      header: 'Time',
      render: (r) => formatTime(r.createdAt),
    },
    {
      key: 'user',
      header: 'User',
      render: (r) =>
        typeof r.user === 'object' ? (r.user as { name: string }).name : r.user,
    },
    { key: 'action', header: 'Action' },
    { key: 'entity', header: 'Entity' },
    { key: 'entityId', header: 'Entity ID' },
  ];

  return (
    <PageWrapper
      title="Activity Logs"
      actions={
        <Button
          variant="secondary"
          onClick={async () => {
            const { data: rows } = await activityApi.export();
            exportToExcel(
              rows.map((r) => ({
                Date: formatDate(r.createdAt),
                Time: formatTime(r.createdAt),
                User: typeof r.user === 'object' ? (r.user as { email: string }).email : r.user,
                Action: r.action,
                Entity: r.entity,
                EntityId: r.entityId,
              })),
              'activity-logs',
            );
          }}
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPageChange={setPage}
        keyExtractor={(r) => r._id}
      />
    </PageWrapper>
  );
}
