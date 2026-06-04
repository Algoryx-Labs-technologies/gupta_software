import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Download, FileSpreadsheet, X } from 'lucide-react';
import {
  createPurchaseSchema,
  computePurchaseTotals,
  computePurchaseAggregateTotals,
  type CreatePurchaseInput,
  type Purchase,
  type PurchaseItemInput,
  type Tender,
  type TenderSite,
} from '@gupta/shared';
import { purchasesApi } from '@/api/purchases';
import { tendersApi } from '@/api/tenders';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/Modal';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { exportToExcel } from '@/lib/exportToExcel';
import { exportToPdf } from '@/lib/exportToPdf';
import { toast } from 'sonner';

type PurchaseRow = Purchase & {
  vendor?: { name: string };
  tender?: { tenderName: string; tenderNo: string };
  site?: { name: string };
};

type PopulatedTenderSite = TenderSite & {
  site?: string | { _id: string; name: string; code: string };
};

type TenderOption = Tender & {
  sites: PopulatedTenderSite[];
};

function getSiteRefId(siteRef?: string | { _id: string }): string | undefined {
  if (!siteRef) return undefined;
  return typeof siteRef === 'string' ? siteRef : siteRef._id;
}

function getTenderSiteKey(site: PopulatedTenderSite): string {
  return getSiteRefId(site.site) ?? `name:${site.siteNameRaw}`;
}

function findSiteKey(
  sites: PopulatedTenderSite[],
  siteId?: string,
  siteNameRaw?: string,
): string {
  if (siteId) {
    const match = sites.find((s) => getSiteRefId(s.site) === siteId);
    if (match) return getTenderSiteKey(match);
  }
  if (siteNameRaw) {
    const match = sites.find((s) => s.siteNameRaw === siteNameRaw);
    if (match) return getTenderSiteKey(match);
    return `name:${siteNameRaw}`;
  }
  return '';
}

const defaultItem = (): PurchaseItemInput => ({
  itemDescription: '',
  qty: 0,
  unit: 'NOS',
  perRate: 0,
  freight: 0,
  labour: 0,
  gstPercent: 18,
  isHmPurchase: false,
});

const defaultFormValues = (): CreatePurchaseInput => ({
  vendorNameRaw: '',
  tender: '',
  billNo: '',
  siteNameRaw: '',
  items: [defaultItem()],
  billDate: new Date(),
});

function formatItemsSummary(items: Purchase['items']) {
  if (!items?.length) return '—';
  if (items.length === 1) return items[0].itemDescription;
  return `${items[0].itemDescription} (+${items.length - 1} more)`;
}

function purchaseToFormValues(purchase: Purchase): CreatePurchaseInput {
  const tenderId =
    typeof purchase.tender === 'string'
      ? purchase.tender
      : purchase.tender && typeof purchase.tender === 'object'
        ? (purchase.tender as { _id: string })._id
        : undefined;
  const siteId =
    typeof purchase.site === 'string'
      ? purchase.site
      : purchase.site && typeof purchase.site === 'object'
        ? (purchase.site as { _id: string })._id
        : undefined;

  return {
    vendor: typeof purchase.vendor === 'string' ? purchase.vendor : undefined,
    vendorNameRaw: purchase.vendorNameRaw,
    tender: tenderId ?? '',
    billNo: purchase.billNo,
    site: siteId,
    siteNameRaw: purchase.siteNameRaw,
    billDate: new Date(purchase.billDate),
    notes: purchase.notes,
    items: purchase.items.map((item) => ({
      itemDescription: item.itemDescription,
      item: typeof item.item === 'string' ? item.item : undefined,
      qty: item.qty,
      unit: item.unit,
      perRate: item.perRate,
      freight: item.freight,
      labour: item.labour,
      gstPercent: item.gstPercent,
      isHmPurchase: item.isHmPurchase,
    })),
  };
}

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSiteKey, setSelectedSiteKey] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search],
    queryFn: () => purchasesApi.list({ page, limit: 20, search: search || undefined }),
  });

  const form = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema) as never,
    defaultValues: defaultFormValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { data: tendersData } = useQuery({
    queryKey: ['tenders', 'purchase-form'],
    queryFn: () => tendersApi.list({ limit: 100, sortBy: 'tenderName', sortOrder: 'asc' }),
    enabled: modalOpen,
  });

  const tenders = (tendersData?.data ?? []) as TenderOption[];
  const selectedTenderId = form.watch('tender');
  const selectedTender = tenders.find((t) => t._id === selectedTenderId);

  const tenderOptions = useMemo(
    () => [
      { value: '', label: 'Select tender' },
      ...tenders.map((t) => ({
        value: t._id,
        label: `${t.tenderNo} — ${t.tenderName}`,
      })),
    ],
    [tenders],
  );

  const siteOptions = useMemo(() => {
    if (!selectedTender?.sites?.length) {
      return [{ value: '', label: selectedTenderId ? 'No sites for this tender' : 'Select tender first' }];
    }
    return [
      { value: '', label: 'Select site' },
      ...selectedTender.sites.map((site) => ({
        value: getTenderSiteKey(site),
        label: site.siteNameRaw,
      })),
    ];
  }, [selectedTender, selectedTenderId]);

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedSiteKey(key);

    if (!key || !selectedTender) {
      form.setValue('site', undefined);
      form.setValue('siteNameRaw', '');
      return;
    }

    const siteEntry = selectedTender.sites.find((s) => getTenderSiteKey(s) === key);
    if (!siteEntry) return;

    const siteId = getSiteRefId(siteEntry.site);
    form.setValue('site', siteId, { shouldValidate: true });
    form.setValue('siteNameRaw', siteEntry.siteNameRaw, { shouldValidate: true });
  };

  const syncSiteKeyFromForm = (tenderId?: string, siteId?: string, siteNameRaw?: string) => {
    if (!tenderId) {
      setSelectedSiteKey('');
      return;
    }
    const tender = tenders.find((t) => t._id === tenderId);
    if (!tender) return;
    setSelectedSiteKey(findSiteKey(tender.sites, siteId, siteNameRaw));
  };

  const watchedItems = form.watch('items');
  const itemTotals = (watchedItems ?? []).map((item) => computePurchaseTotals(item));
  const totals = computePurchaseAggregateTotals(itemTotals);

  useEffect(() => {
    if (!modalOpen || !tenders.length) return;
    const tenderId = form.getValues('tender');
    if (!tenderId) return;
    syncSiteKeyFromForm(tenderId, form.getValues('site'), form.getValues('siteNameRaw'));
  }, [modalOpen, tenders, form]);

  const createMutation = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase created');
      closeModal();
    },
    onError: () => toast.error('Failed to create purchase'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePurchaseInput }) =>
      purchasesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase updated');
      closeModal();
    },
    onError: () => toast.error('Failed to update purchase'),
  });

  const deleteMutation = useMutation({
    mutationFn: purchasesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase deleted');
      setDeleteId(null);
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setSelectedSiteKey('');
    form.reset(defaultFormValues());
  };

  const openCreate = () => {
    form.reset(defaultFormValues());
    setSelectedSiteKey('');
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = async (purchase: PurchaseRow) => {
    try {
      const full = await purchasesApi.get(purchase._id);
      const values = purchaseToFormValues(full);
      form.reset(values);
      setEditId(purchase._id);
      setModalOpen(true);
      syncSiteKeyFromForm(values.tender, values.site, values.siteNameRaw);
    } catch {
      toast.error('Failed to load purchase');
    }
  };

  const onSubmit = (data: CreatePurchaseInput) => {
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const handleExportExcel = async () => {
    const { data: rows } = await purchasesApi.export({ search: search || undefined });
    exportToExcel(
      rows.flatMap((r) =>
        r.items.map((item) => ({
          'Serial No': r.serialNo,
          Vendor: r.vendorNameRaw,
          Item: item.itemDescription,
          'Bill No': r.billNo,
          Site: r.siteNameRaw,
          Qty: item.qty,
          Unit: item.unit,
          Rate: item.perRate,
          'Line Total': item.grandTotal,
          'Bill Total': r.grandTotal,
          Date: formatDate(r.billDate),
        })),
      ),
      'purchases',
    );
  };

  const handleExportPdf = async () => {
    const { data: rows } = await purchasesApi.export({ search: search || undefined });
    exportToPdf(
      'Purchase Report',
      [
        { header: 'Bill No', dataKey: 'billNo' },
        { header: 'Vendor', dataKey: 'vendorNameRaw' },
        { header: 'Item', dataKey: 'itemDescription' },
        { header: 'Site', dataKey: 'siteNameRaw' },
        { header: 'Line Total', dataKey: 'lineTotal' },
        { header: 'Bill Total', dataKey: 'billTotal' },
      ],
      rows.flatMap((r) =>
        r.items.map((item) => ({
          billNo: r.billNo,
          vendorNameRaw: r.vendorNameRaw,
          itemDescription: item.itemDescription,
          siteNameRaw: r.siteNameRaw,
          lineTotal: item.grandTotal,
          billTotal: r.grandTotal,
        })),
      ) as unknown as Record<string, unknown>[],
      'purchases',
    );
  };

  const columns: Column<PurchaseRow>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'billNo', header: 'Bill No', sortable: true },
    { key: 'billDate', header: 'Date', render: (r) => formatDate(r.billDate) },
    { key: 'vendorNameRaw', header: 'Vendor' },
    {
      key: 'tender',
      header: 'Tender',
      render: (r) => {
        const tender = r.tender as { tenderNo?: string; tenderName?: string } | string | undefined;
        if (!tender || typeof tender === 'string') return '—';
        return tender.tenderNo ?? '—';
      },
    },
    {
      key: 'items',
      header: 'Items',
      render: (r) => (
        <span title={r.items.map((i) => i.itemDescription).join(', ')}>
          {formatItemsSummary(r.items)}
        </span>
      ),
    },
    { key: 'siteNameRaw', header: 'Site' },
    {
      key: 'itemCount',
      header: 'Lines',
      render: (r) => r.items.length,
    },
    { key: 'grandTotal', header: 'Total', render: (r) => formatCurrency(r.grandTotal) },
    {
      key: 'isHmPurchase',
      header: 'HM',
      render: (r) =>
        r.items.some((i) => i.isHmPurchase) ? <Badge variant="active">HM</Badge> : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-1">
          <button className="rounded p-1 hover:bg-brand-50" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </button>
          <button className="rounded p-1 hover:bg-red-50" onClick={() => setDeleteId(r._id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Purchases"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportPdf}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Purchase
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search bill no, item, vendor, site..."
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
        data={(data?.data ?? []) as PurchaseRow[]}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPageChange={setPage}
        keyExtractor={(r) => r._id}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? 'Edit Purchase' : 'Add Purchase'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Vendor Name"
            error={form.formState.errors.vendorNameRaw?.message}
            {...form.register('vendorNameRaw')}
          />
          <Input
            label="Bill No"
            error={form.formState.errors.billNo?.message}
            {...form.register('billNo')}
          />
          <Input label="Bill Date" type="date" {...form.register('billDate', { valueAsDate: true })} />
          <Select
            label="Tender"
            options={tenderOptions}
            error={form.formState.errors.tender?.message}
            {...form.register('tender', {
              onChange: () => {
                form.setValue('site', undefined);
                form.setValue('siteNameRaw', '');
                setSelectedSiteKey('');
              },
            })}
          />
          <Select
            label="Site"
            options={siteOptions}
            value={selectedSiteKey}
            onChange={handleSiteChange}
            disabled={!selectedTenderId}
            error={form.formState.errors.siteNameRaw?.message}
          />
          <input type="hidden" {...form.register('siteNameRaw')} />

          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Items</h3>
              <Button type="button" variant="secondary" onClick={() => append(defaultItem())}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>

            {form.formState.errors.items?.message && (
              <p className="text-sm text-red-500">{form.formState.errors.items.message}</p>
            )}

            {fields.map((field, index) => {
              const lineTotal = itemTotals[index] ?? computePurchaseTotals({});
              return (
                <div key={field.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Item Description"
                        error={form.formState.errors.items?.[index]?.itemDescription?.message}
                        {...form.register(`items.${index}.itemDescription`)}
                      />
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      step="any"
                      {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                    />
                    <Input label="Unit" {...form.register(`items.${index}.unit`)} />
                    <Input
                      label="Rate"
                      type="number"
                      step="any"
                      {...form.register(`items.${index}.perRate`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Freight"
                      type="number"
                      step="any"
                      {...form.register(`items.${index}.freight`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Labour"
                      type="number"
                      step="any"
                      {...form.register(`items.${index}.labour`, { valueAsNumber: true })}
                    />
                    <Input
                      label="GST %"
                      type="number"
                      {...form.register(`items.${index}.gstPercent`, { valueAsNumber: true })}
                    />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" {...form.register(`items.${index}.isHmPurchase`)} />
                      HM Purchase
                    </label>
                    <div className="sm:col-span-2 text-sm text-gray-500">
                      Line total: {formatCurrency(lineTotal.grandTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sm:col-span-2 rounded-xl bg-brand-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span>{formatCurrency(totals.subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatCurrency(totals.gstAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Notes" {...form.register('notes')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase record?"
      />
    </PageWrapper>
  );
}
