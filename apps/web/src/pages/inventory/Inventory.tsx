import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowRightLeft, Download, MinusCircle, Package } from 'lucide-react';
import type { InventoryLedgerEntry } from '@gupta/shared';
import type {
  AllocateStockInput,
  ConsumeStockInput,
  InventoryReceipt,
  InventoryStockLine,
} from '@gupta/shared';
import { inventoryApi } from '@/api/inventory';
import { sitesApi } from '@/api/masters';
import { tendersApi } from '@/api/tenders';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Select, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { Pagination } from '@/components/Pagination';
import { exportToExcel } from '@/lib/exportToExcel';
import { formatDate } from '@/lib/formatters';
import { toast } from '@/lib/notify';

type Tab = 'overview' | 'receipts' | 'ledger';

type LedgerDisplayRow = {
  id: string;
  date: string | Date;
  label: string;
  badgeVariant: string;
  itemDescription: string;
  unit?: string;
  quantity: number;
  detail: React.ReactNode;
  qtyPrefix: '+' | '−' | '';
  qtyClass: string;
  reference?: string;
};

function isAllocationPair(a: InventoryLedgerEntry, b: InventoryLedgerEntry) {
  return (
    a.movementType === 'ALLOCATION' &&
    b.movementType === 'ALLOCATION' &&
    a.fromSite === b.fromSite &&
    a.toSite === b.toSite &&
    a.itemDescription === b.itemDescription &&
    a.quantity === b.quantity &&
    Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) < 5000
  );
}

function buildLedgerRows(entries: InventoryLedgerEntry[]): LedgerDisplayRow[] {
  const used = new Set<string>();
  const rows: LedgerDisplayRow[] = [];

  for (const entry of entries) {
    if (used.has(entry._id)) continue;

    if (entry.movementType === 'ALLOCATION' && entry.direction === 'OUT') {
      const inEntry = entries.find(
        (e) =>
          !used.has(e._id) &&
          e.direction === 'IN' &&
          isAllocationPair(entry, e),
      );
      if (inEntry) {
        used.add(entry._id);
        used.add(inEntry._id);
        rows.push({
          id: entry._id,
          date: entry.createdAt,
          label: 'Transfer',
          badgeVariant: 'active',
          itemDescription: entry.itemDescription,
          unit: entry.unit,
          quantity: entry.quantity,
          detail: (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium">{entry.fromSiteName ?? '—'}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted" />
              <span className="font-medium">{entry.toSiteName ?? '—'}</span>
            </span>
          ),
          qtyPrefix: '',
          qtyClass: 'text-gray-900',
          reference: entry.notes ?? undefined,
        });
        continue;
      }
    }

    if (entry.movementType === 'ALLOCATION' && entry.direction === 'IN') {
      const hasOutPair = entries.some(
        (e) => !used.has(e._id) && e.direction === 'OUT' && isAllocationPair(e, entry),
      );
      if (hasOutPair) continue;
    }

    used.add(entry._id);

    if (entry.movementType === 'PURCHASE_IN') {
      rows.push({
        id: entry._id,
        date: entry.createdAt,
        label: 'Stock In',
        badgeVariant: 'completed',
        itemDescription: entry.itemDescription,
        unit: entry.unit,
        quantity: entry.quantity,
        detail: (
          <span>
            Received at <span className="font-medium">{entry.siteName ?? entry.siteCode ?? '—'}</span>
          </span>
        ),
        qtyPrefix: '+',
        qtyClass: 'text-green-700',
        reference: entry.billNo ? `Bill ${entry.billNo}` : entry.notes,
      });
      continue;
    }

    if (entry.movementType === 'CONSUMPTION') {
      rows.push({
        id: entry._id,
        date: entry.createdAt,
        label: 'Stock Out',
        badgeVariant: 'expired',
        itemDescription: entry.itemDescription,
        unit: entry.unit,
        quantity: entry.quantity,
        detail: (
          <span>
            Issued from <span className="font-medium">{entry.siteName ?? entry.siteCode ?? '—'}</span>
          </span>
        ),
        qtyPrefix: '−',
        qtyClass: 'text-red-600',
        reference: entry.notes,
      });
      continue;
    }

    const isEntry = entry.direction === 'IN';
    rows.push({
      id: entry._id,
      date: entry.createdAt,
      label: isEntry ? 'Entry' : 'Exit',
      badgeVariant: isEntry ? 'completed' : 'expired',
      itemDescription: entry.itemDescription,
      unit: entry.unit,
      quantity: entry.quantity,
      detail: (
        <span>
          {isEntry ? 'Added at' : 'Removed from'}{' '}
          <span className="font-medium">{entry.siteName ?? entry.siteCode ?? '—'}</span>
        </span>
      ),
      qtyPrefix: isEntry ? '+' : '−',
      qtyClass: isEntry ? 'text-green-700' : 'text-red-600',
      reference: entry.notes ?? entry.billNo,
    });
  }

  return rows;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [allocateForm, setAllocateForm] = useState<AllocateStockInput>({
    fromSiteId: '',
    toSiteId: '',
    itemDescription: '',
    quantity: 0,
  });
  const [allocateContext, setAllocateContext] = useState<{
    fromSiteLabel: string;
    itemLabel: string;
    availableQty: number;
    unit?: string;
  } | null>(null);
  const [consumeForm, setConsumeForm] = useState<ConsumeStockInput>({
    siteId: '',
    itemDescription: '',
    quantity: 0,
  });
  const [consumeItemKey, setConsumeItemKey] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['inventory', 'overview'],
    queryFn: inventoryApi.overview,
  });

  const stockLines = overview?.stockLines ?? [];

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ['inventory', 'receipts'],
    queryFn: inventoryApi.receipts,
    enabled: tab === 'receipts' || consumeOpen,
  });

  const { data: sitesData } = useQuery({
    queryKey: ['sites', 'inventory-allocate'],
    queryFn: () => sitesApi.list({ limit: 100 }),
    enabled: allocateOpen,
  });

  const { data: tendersData } = useQuery({
    queryKey: ['tenders', 'inventory-allocate'],
    queryFn: () => tendersApi.list({ limit: 100 }),
    enabled: allocateOpen,
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['inventory', 'ledger', ledgerPage],
    queryFn: () => inventoryApi.ledger({ page: ledgerPage, limit: 20 }),
    enabled: tab === 'ledger',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const allocateMutation = useMutation({
    mutationFn: inventoryApi.allocate,
    onSuccess: () => {
      invalidate();
      toast.success('Stock allocated');
      setAllocateOpen(false);
      setAllocateContext(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'Failed to allocate stock'),
  });

  const consumeMutation = useMutation({
    mutationFn: inventoryApi.consume,
    onSuccess: () => {
      invalidate();
      toast.success('Stock issued');
      setConsumeOpen(false);
      setConsumeItemKey('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'Failed to issue stock'),
  });

  const toSiteOptions = useMemo(() => {
    const fromId = allocateForm.fromSiteId?.toString() ?? '';
    const fromName = allocateContext?.fromSiteLabel.split('—').pop()?.trim().toLowerCase() ?? '';
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    const addOption = (value: string, label: string) => {
      if (!value || value === fromId || seen.has(value)) return;
      seen.add(value);
      options.push({ value, label });
    };

    for (const site of sitesData?.data ?? overview?.sites ?? []) {
      addOption(site._id.toString(), `${site.code} — ${site.name}`);
    }

    for (const tender of tendersData?.data ?? []) {
      for (const tenderSite of tender.sites ?? []) {
        const name = tenderSite.siteNameRaw?.trim();
        if (!name) continue;

        const siteRef = tenderSite.site as string | { _id: string } | undefined;
        const linkedId = typeof siteRef === 'string' ? siteRef : siteRef?._id;

        if (linkedId) {
          addOption(linkedId.toString(), name);
        } else if (name.toLowerCase() !== fromName) {
          addOption(`name:${name}`, name);
        }
      }
    }

    options.sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: '', label: 'Select destination site' }, ...options];
  }, [sitesData, tendersData, overview?.sites, allocateForm.fromSiteId, allocateContext]);

  const openAllocateFromStock = (line: InventoryStockLine) => {
    setAllocateForm({
      fromSiteId: line.siteId,
      toSiteId: '',
      itemId: line.itemId,
      itemDescription: line.itemDescription,
      unit: line.unit,
      quantity: line.quantity,
      notes: line.billNo ? `From bill ${line.billNo}` : undefined,
    });
    setAllocateContext({
      fromSiteLabel: `${line.siteCode} — ${line.siteName}`,
      itemLabel: line.itemDescription,
      availableQty: line.quantity,
      unit: line.unit,
    });
    setAllocateOpen(true);
  };

  const openAllocateFromReceipt = (receipt: InventoryReceipt) => {
    setAllocateForm({
      fromSiteId: receipt.siteId,
      toSiteId: '',
      itemId: receipt.itemId,
      itemDescription: receipt.itemDescription,
      unit: receipt.unit,
      quantity: receipt.balanceQty,
      notes: `From purchase #${receipt.purchaseSerialNo} (${receipt.billNo})`,
    });
    setAllocateContext({
      fromSiteLabel: `${receipt.siteCode} — ${receipt.siteName}`,
      itemLabel: receipt.itemDescription,
      availableQty: receipt.balanceQty,
      unit: receipt.unit,
    });
    setAllocateOpen(true);
  };

  const consumeSiteOptions = useMemo(() => {
    const bySite = new Map<string, string>();
    for (const line of stockLines) {
      if (line.quantity <= 0) continue;
      bySite.set(line.siteId, `${line.siteCode} — ${line.siteName}`);
    }
    return [
      { value: '', label: 'Select site' },
      ...[...bySite.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [stockLines]);

  const consumeItemOptions = useMemo(() => {
    if (!consumeForm.siteId) {
      return [{ value: '', label: 'Select site first' }];
    }
    const lines = stockLines.filter(
      (line) => line.siteId === consumeForm.siteId && line.quantity > 0,
    );
    if (!lines.length) {
      return [{ value: '', label: 'No stock at this site' }];
    }
    return [
      { value: '', label: 'Select item' },
      ...lines.map((line) => ({
        value: line.itemKey,
        label: `${line.itemDescription} (${line.quantity} ${line.unit ?? ''} available)`.trim(),
      })),
    ];
  }, [stockLines, consumeForm.siteId]);

  const selectedConsumeLine = useMemo(() => {
    if (!consumeForm.siteId || !consumeItemKey) return null;
    return (
      stockLines.find(
        (line) => line.siteId === consumeForm.siteId && line.itemKey === consumeItemKey,
      ) ?? null
    );
  }, [stockLines, consumeForm.siteId, consumeItemKey]);

  const handleConsumeSiteChange = (siteId: string) => {
    setConsumeForm({
      siteId,
      itemDescription: '',
      quantity: 0,
    });
    setConsumeItemKey('');
  };

  const handleConsumeItemChange = (itemKey: string) => {
    setConsumeItemKey(itemKey);
    const line = stockLines.find(
      (entry) => entry.siteId === consumeForm.siteId && entry.itemKey === itemKey,
    );
    if (!line) return;
    setConsumeForm((f) => ({
      ...f,
      itemId: line.itemId,
      itemDescription: line.itemDescription,
      unit: line.unit,
      quantity: line.quantity,
    }));
  };

  const openConsumeEmpty = () => {
    setConsumeForm({ siteId: '', itemDescription: '', quantity: 0 });
    setConsumeItemKey('');
    setConsumeOpen(true);
  };

  const openConsumeFromStock = (line: InventoryStockLine) => {
    setConsumeForm({
      siteId: line.siteId,
      itemId: line.itemId,
      itemDescription: line.itemDescription,
      unit: line.unit,
      quantity: line.quantity,
      notes: '',
    });
    setConsumeItemKey(line.itemKey);
    setConsumeOpen(true);
  };

  const openConsumeFromReceipt = (receipt: InventoryReceipt) => {
    setConsumeForm({
      siteId: receipt.siteId,
      itemId: receipt.itemId,
      itemDescription: receipt.itemDescription,
      unit: receipt.unit,
      quantity: receipt.balanceQty,
      notes: '',
    });
    setConsumeItemKey(receipt.itemKey);
    setConsumeOpen(true);
  };

  const handleConsumeSubmit = () => {
    if (!consumeForm.siteId) {
      toast.error('Please select a site');
      return;
    }
    if (!consumeItemKey || !consumeForm.itemDescription) {
      toast.error('Please select an item');
      return;
    }

    const maxQty = selectedConsumeLine?.quantity ?? 0;
    if (!consumeForm.quantity || consumeForm.quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (consumeForm.quantity > maxQty) {
      toast.error(`Quantity cannot exceed available stock (${maxQty})`);
      return;
    }

    consumeMutation.mutate(consumeForm);
  };

  const handleAllocateSubmit = () => {
    const selected = allocateForm.toSiteId;
    if (!selected) {
      toast.error('Please select destination site');
      return;
    }

    const maxQty = allocateContext?.availableQty ?? 0;
    if (!allocateForm.quantity || allocateForm.quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (allocateForm.quantity > maxQty) {
      toast.error(`Quantity cannot exceed available stock (${maxQty})`);
      return;
    }

    const payload: AllocateStockInput = { ...allocateForm };
    if (selected.startsWith('name:')) {
      payload.toSiteId = undefined;
      payload.toSiteName = selected.slice(5);
    } else {
      payload.toSiteId = selected;
      payload.toSiteName = undefined;
    }

    allocateMutation.mutate(payload);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Site Stock' },
    { id: 'receipts', label: 'Purchase Receipts' },
    { id: 'ledger', label: 'Ledger' },
  ];

  const loading = overviewLoading;

  return (
    <PageWrapper
      title="Inventory"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openConsumeEmpty}>
            <MinusCircle className="h-4 w-4" /> Issue Stock
          </Button>
          {stockLines.length > 0 && (
            <Button
              variant="secondary"
              onClick={() =>
                exportToExcel(
                  stockLines.map((line) => ({
                    Item: line.itemName,
                    Description: line.itemDescription,
                    Unit: line.unit ?? '',
                    Site: `${line.siteCode} — ${line.siteName}`,
                    Quantity: line.quantity,
                    'Bill No': line.billNo ?? '',
                  })),
                  'inventory-stock',
                )
              }
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-4 flex gap-2 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-muted hover:text-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : tab === 'overview' ? (
        <StockListTab
          stockLines={stockLines}
          onAllocate={openAllocateFromStock}
          onIssue={openConsumeFromStock}
        />
      ) : tab === 'receipts' ? (
        <ReceiptsTab
          receipts={receipts ?? []}
          loading={receiptsLoading}
          onAllocate={openAllocateFromReceipt}
          onConsume={openConsumeFromReceipt}
        />
      ) : (
        <LedgerTab
          entries={ledger?.data ?? []}
          loading={ledgerLoading}
          page={ledgerPage}
          totalPages={ledger?.meta.totalPages ?? 1}
          total={ledger?.meta.total}
          onPageChange={setLedgerPage}
        />
      )}

      <Modal
        open={allocateOpen}
        onClose={() => {
          setAllocateOpen(false);
          setAllocateContext(null);
        }}
        title="Allocate Stock"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setAllocateOpen(false);
                setAllocateContext(null);
              }}
            >
              Cancel
            </Button>
            <Button loading={allocateMutation.isPending} onClick={handleAllocateSubmit}>
              Allocate
            </Button>
          </div>
        }
      >
        {allocateContext && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Item</p>
                  <p className="mt-1 font-medium text-gray-900">{allocateContext.itemLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">From Site</p>
                  <p className="mt-1 font-medium text-gray-900">{allocateContext.fromSiteLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Available</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {allocateContext.availableQty} {allocateContext.unit ?? ''}
                  </p>
                </div>
              </div>
            </div>
            <Input
              label={`Quantity to allocate${allocateContext.unit ? ` (${allocateContext.unit})` : ''}`}
              type="number"
              min={0}
              max={allocateContext.availableQty}
              step="any"
              value={allocateForm.quantity || ''}
              onChange={(e) =>
                setAllocateForm((f) => ({ ...f, quantity: Number(e.target.value) }))
              }
            />
            {toSiteOptions.length <= 1 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No other sites found. Add sites under <strong>Masters → Sites</strong> or add more sites
                to your tender, then try again.
              </p>
            ) : (
              <Select
                label="To Site"
                options={toSiteOptions}
                value={allocateForm.toSiteId}
                onChange={(e) => setAllocateForm((f) => ({ ...f, toSiteId: e.target.value }))}
              />
            )}
            <Textarea
              label="Notes (optional)"
              value={allocateForm.notes ?? ''}
              onChange={(e) => setAllocateForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={consumeOpen}
        onClose={() => {
          setConsumeOpen(false);
          setConsumeItemKey('');
        }}
        title="Issue / Consume Stock"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setConsumeOpen(false);
                setConsumeItemKey('');
              }}
            >
              Cancel
            </Button>
            <Button loading={consumeMutation.isPending} onClick={handleConsumeSubmit}>
              Issue Stock
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Site"
            options={consumeSiteOptions}
            value={consumeForm.siteId}
            onChange={(e) => handleConsumeSiteChange(e.target.value)}
          />
          <Select
            label="Item"
            options={consumeItemOptions}
            value={consumeItemKey}
            onChange={(e) => handleConsumeItemChange(e.target.value)}
            disabled={!consumeForm.siteId}
          />
          {selectedConsumeLine && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Description</p>
                  <p className="mt-1 font-medium text-gray-900">{selectedConsumeLine.itemDescription}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Available</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedConsumeLine.quantity} {selectedConsumeLine.unit ?? ''}
                  </p>
                </div>
                {selectedConsumeLine.billNo && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bill No</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedConsumeLine.billNo}</p>
                  </div>
                )}
                {selectedConsumeLine.unit && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unit</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedConsumeLine.unit}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <Input
            label={`Quantity to issue${selectedConsumeLine?.unit ? ` (${selectedConsumeLine.unit})` : ''}`}
            type="number"
            min={0}
            max={selectedConsumeLine?.quantity}
            step="any"
            disabled={!selectedConsumeLine}
            value={consumeForm.quantity || ''}
            onChange={(e) => setConsumeForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          />
          <Textarea
            label="Notes (optional)"
            value={consumeForm.notes ?? ''}
            onChange={(e) => setConsumeForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}

function StockListTab({
  stockLines,
  onAllocate,
  onIssue,
}: {
  stockLines: InventoryStockLine[];
  onAllocate: (line: InventoryStockLine) => void;
  onIssue: (line: InventoryStockLine) => void;
}) {
  return (
    <div className="card overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border bg-brand-50/50">
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Site</th>
              <th className="px-4 py-3 text-left font-medium">Bill No</th>
              <th className="px-4 py-3 text-right font-medium">Available</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {stockLines.map((line) => (
              <tr key={`${line.itemKey}:${line.siteId}`} className="border-b border-border/60 hover:bg-brand-50/20">
                <td className="px-4 py-3 font-medium">{line.itemName}</td>
                <td className="px-4 py-3">
                  <div>{line.itemDescription}</div>
                  {line.unit && <div className="text-xs text-muted">Unit: {line.unit}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{line.siteCode}</div>
                  <div className="text-xs text-muted">{line.siteName}</div>
                </td>
                <td className="px-4 py-3 text-muted">{line.billNo ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {line.quantity} {line.unit ?? ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => onAllocate(line)}>
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Allocate
                    </Button>
                    <Button variant="ghost" className="!px-3 !py-1.5" onClick={() => onIssue(line)}>
                      <MinusCircle className="h-3.5 w-3.5" /> Issue
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {stockLines.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No stock yet. Add purchases with a site and item quantity — stock syncs automatically on refresh.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiptsTab({
  receipts,
  loading,
  onAllocate,
  onConsume,
}: {
  receipts: InventoryReceipt[];
  loading: boolean;
  onAllocate: (receipt: InventoryReceipt) => void;
  onConsume: (receipt: InventoryReceipt) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border bg-brand-50/50">
              <th className="px-4 py-3 text-left font-medium">Purchase</th>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Site</th>
              <th className="px-4 py-3 text-right font-medium">Received</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={`${receipt.purchaseId}-${receipt.purchaseItemId}`} className="border-b border-border/60">
                <td className="px-4 py-3">
                  <div className="font-medium">#{receipt.purchaseSerialNo}</div>
                  <div className="text-xs text-muted">
                    {receipt.billNo} · {formatDate(receipt.billDate)}
                  </div>
                </td>
                <td className="px-4 py-3">{receipt.itemDescription}</td>
                <td className="px-4 py-3">{receipt.siteCode}</td>
                <td className="px-4 py-3 text-right">
                  {receipt.receivedQty} {receipt.unit ?? ''}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {receipt.balanceQty} {receipt.unit ?? ''}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1"
                      disabled={receipt.balanceQty <= 0}
                      onClick={() => onAllocate(receipt)}
                    >
                      Allocate
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1"
                      disabled={receipt.balanceQty <= 0}
                      onClick={() => onConsume(receipt)}
                    >
                      Issue
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  No purchase receipts found. Add purchases with items and a linked site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LedgerTab({
  entries,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  entries: Awaited<ReturnType<typeof inventoryApi.ledger>>['data'];
  loading: boolean;
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}) {
  const rows = useMemo(() => buildLedgerRows(entries), [entries]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border bg-brand-50/50">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Transaction</th>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Details</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 hover:bg-brand-50/20">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.date)}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.badgeVariant}>{row.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{row.itemDescription}</div>
                  {row.unit && <div className="text-xs text-muted">{row.unit}</div>}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.detail}</td>
                <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${row.qtyClass}`}>
                  {row.qtyPrefix}
                  {row.quantity} {row.unit ?? ''}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{row.reference ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  No ledger entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
    </div>
  );
}
