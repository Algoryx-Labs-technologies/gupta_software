import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { stockApi } from '@/api/stock';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { exportMatrixToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stock', 'matrix'],
    queryFn: stockApi.matrix,
  });

  const cellMap = useMemo(() => {
    const map = new Map<string, number>();
    data?.cells.forEach((c) => {
      map.set(`${c.itemId}:${c.siteId}:${c.specification ?? ''}`, c.quantity);
    });
    return map;
  }, [data]);

  const getQty = useCallback(
    (itemId: string, siteId: string) => cellMap.get(`${itemId}:${siteId}:`) ?? 0,
    [cellMap],
  );

  const upsertMutation = useMutation({
    mutationFn: stockApi.upsertCell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'matrix'] });
      toast.success('Stock updated');
      setEditingCell(null);
    },
    onError: () => toast.error('Failed to update stock'),
  });

  const startEdit = (itemId: string, siteId: string) => {
    const key = `${itemId}:${siteId}`;
    setEditingCell(key);
    setEditValue(String(getQty(itemId, siteId)));
  };

  const saveEdit = (itemId: string, siteId: string) => {
    const quantity = parseFloat(editValue) || 0;
    upsertMutation.mutate({ itemId, siteId, specification: '', quantity });
  };

  if (isLoading) {
    return (
      <PageWrapper title="Inventory">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  const items = data?.items ?? [];
  const sites = data?.sites ?? [];

  return (
    <PageWrapper
      title="Site-wise Inventory"
      actions={
        items.length > 0 && sites.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => exportMatrixToExcel(items, sites, getQty, 'inventory-matrix')}
          >
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        ) : undefined
      }
    >
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-brand-50/50">
                <th className="sticky left-0 z-10 bg-brand-50/90 px-4 py-3 text-left font-medium">
                  Item
                </th>
                {sites.map((site) => (
                  <th key={site._id} className="min-w-[100px] px-3 py-3 text-center font-medium">
                    <div>{site.code}</div>
                    <div className="text-xs font-normal text-muted">{site.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-border/60 hover:bg-brand-50/20">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2 font-medium">{item.name}</td>
                  {sites.map((site) => {
                    const key = `${item._id}:${site._id}`;
                    const isEditing = editingCell === key;
                    return (
                      <td key={site._id} className="px-2 py-1 text-center">
                        {isEditing ? (
                          <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(item._id, site._id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(item._id, site._id);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-20 rounded-lg border border-brand-400 px-2 py-1 text-center text-sm outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(item._id, site._id)}
                            className="min-w-[60px] rounded-lg px-2 py-1.5 hover:bg-brand-50"
                          >
                            {getQty(item._id, site._id) || '—'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={sites.length + 1} className="py-12 text-center text-muted">
                    Add items and sites to build the inventory matrix.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
