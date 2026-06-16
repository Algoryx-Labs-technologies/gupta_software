import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Download, FileSpreadsheet, X, Info, FileText } from 'lucide-react';
import {
  createPurchaseSchema,
  computePurchaseTotals,
  computePurchaseAggregateTotals,
  type Attachment,
  type CreatePurchaseInput,
  type Purchase,
  type PurchaseItemInput,
  type Tender,
  type TenderSite,
} from '@gupta/shared';
import { purchasesApi } from '@/api/purchases';
import { tendersApi } from '@/api/tenders';
import { vendorsApi } from '@/api/masters';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/Modal';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
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
  billName: '',
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

  const vendorId =
    typeof purchase.vendor === 'string'
      ? purchase.vendor
      : purchase.vendor && typeof purchase.vendor === 'object'
        ? (purchase.vendor as { _id: string })._id
        : undefined;

  return {
    vendor: vendorId,
    vendorNameRaw: purchase.vendorNameRaw,
    tender: tenderId ?? '',
    billNo: purchase.billNo,
    billName: purchase.billName ?? '',
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

function formatDateTime(date: string | Date | undefined | null) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function getCreatedByLabel(
  createdBy: string | { _id: string; name: string; email?: string } | undefined,
) {
  if (!createdBy) return '—';
  if (typeof createdBy === 'string') return createdBy;
  return createdBy.email ? `${createdBy.name} (${createdBy.email})` : createdBy.name;
}

function getVendorLabel(vendor: string | { name: string; gstin?: string } | undefined) {
  if (!vendor) return '—';
  if (typeof vendor === 'string') return vendor;
  return vendor.gstin ? `${vendor.name} (GSTIN: ${vendor.gstin})` : vendor.name;
}

function getTenderLabel(tender: string | { tenderNo?: string; tenderName?: string } | undefined) {
  if (!tender) return '—';
  if (typeof tender === 'string') return tender;
  if (tender.tenderNo && tender.tenderName) return `${tender.tenderNo} — ${tender.tenderName}`;
  return tender.tenderNo ?? tender.tenderName ?? '—';
}

function getSiteMasterLabel(site: string | { name: string; code?: string } | undefined) {
  if (!site) return '—';
  if (typeof site === 'string') return site;
  return `${site.name}${site.code ? ` (${site.code})` : ''}`;
}

function getItemMasterLabel(item: string | { name: string } | undefined) {
  if (!item) return '—';
  if (typeof item === 'string') return item;
  return item.name;
}

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [selectedSiteKey, setSelectedSiteKey] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search],
    queryFn: () => purchasesApi.list({ page, limit: 20, search: search || undefined }),
  });

  const { data: detailPurchase, isLoading: detailLoading } = useQuery({
    queryKey: ['purchases', infoId],
    queryFn: () => purchasesApi.get(infoId!),
    enabled: !!infoId,
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

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'purchase-form'],
    queryFn: () => vendorsApi.list({ limit: 100 }),
    enabled: modalOpen,
  });

  const tenders = (tendersData?.data ?? []) as TenderOption[];
  const vendors = vendorsData?.data ?? [];
  const selectedTenderId = form.watch('tender');
  const selectedTender = tenders.find((t) => t._id === selectedTenderId);

  const vendorOptions = useMemo(
    () => [
      { value: '', label: 'Select vendor' },
      ...vendors.map((v) => ({
        value: v._id,
        label: v.name,
      })),
    ],
    [vendors],
  );

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

  useEffect(() => {
    if (!modalOpen || !vendors.length) return;
    if (form.getValues('vendor')) return;
    const nameRaw = form.getValues('vendorNameRaw');
    if (!nameRaw) return;
    const match = vendors.find((v) => v.name === nameRaw);
    if (match) form.setValue('vendor', match._id);
  }, [modalOpen, vendors, form]);

  const createMutation = useMutation({
    mutationFn: purchasesApi.create,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePurchaseInput }) =>
      purchasesApi.update(id, data),
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
    setReceiptFile(null);
    setExistingAttachments([]);
    form.reset(defaultFormValues());
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error('Only PDF receipts are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Receipt must be under 10 MB');
      e.target.value = '';
      return;
    }
    setReceiptFile(file);
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!editId) return;
    try {
      const updated = await purchasesApi.deleteAttachment(editId, attId);
      setExistingAttachments(updated.attachments ?? []);
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Receipt removed');
    } catch {
      toast.error('Failed to remove receipt');
    }
  };

  const openCreate = () => {
    form.reset(defaultFormValues());
    setSelectedSiteKey('');
    setReceiptFile(null);
    setExistingAttachments([]);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = async (purchase: PurchaseRow) => {
    try {
      const full = await purchasesApi.get(purchase._id);
      const values = purchaseToFormValues(full);
      form.reset(values);
      setEditId(purchase._id);
      setReceiptFile(null);
      setExistingAttachments(full.attachments ?? []);
      setModalOpen(true);
      syncSiteKeyFromForm(values.tender, values.site, values.siteNameRaw);
    } catch {
      toast.error('Failed to load purchase');
    }
  };

  const onSubmit = async (data: CreatePurchaseInput) => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        if (receiptFile) {
          const updated = await purchasesApi.uploadAttachment(editId, receiptFile);
          setExistingAttachments(updated.attachments ?? []);
        }
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
        toast.success('Purchase updated');
        closeModal();
      } else {
        const purchase = await createMutation.mutateAsync(data);
        if (receiptFile) {
          await purchasesApi.uploadAttachment(purchase._id, receiptFile);
        }
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
        toast.success('Purchase created');
        closeModal();
      }
    } catch {
      toast.error(editId ? 'Failed to update purchase' : 'Failed to create purchase');
    }
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
          'Bill Name': r.billName,
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
    try {
      const { data: rows } = await purchasesApi.export({ search: search || undefined });
      await exportToPdf(
        'Purchase Report',
        [
          { header: '#', dataKey: 'serialNo' },
          { header: 'Bill No', dataKey: 'billNo' },
          { header: 'Bill Name', dataKey: 'billName' },
          { header: 'Date', dataKey: 'billDate' },
          { header: 'Vendor', dataKey: 'vendorNameRaw' },
          { header: 'Tender', dataKey: 'tender' },
          { header: 'Site', dataKey: 'siteNameRaw' },
          { header: 'Item', dataKey: 'itemDescription' },
          { header: 'Qty', dataKey: 'qty' },
          { header: 'Unit', dataKey: 'unit' },
          { header: 'Rate', dataKey: 'perRate' },
          { header: 'Freight', dataKey: 'freight' },
          { header: 'Labour', dataKey: 'labour' },
          { header: 'GST %', dataKey: 'gstPercent' },
          { header: 'Line Sub Total', dataKey: 'subTotal' },
          { header: 'Line GST', dataKey: 'gstAmount' },
          { header: 'Line Total', dataKey: 'lineTotal' },
          { header: 'Bill Sub Total', dataKey: 'billSubTotal' },
          { header: 'Bill GST', dataKey: 'billGstAmount' },
          { header: 'Bill Grand Total', dataKey: 'billGrandTotal' },
          { header: 'HM', dataKey: 'isHmPurchase' },
          { header: 'Notes', dataKey: 'notes' },
        ],
        rows.flatMap((r) =>
          r.items.map((item) => ({
            serialNo: r.serialNo,
            billNo: r.billNo,
            billName: r.billName,
            billDate: formatDate(r.billDate),
            vendorNameRaw: r.vendorNameRaw,
            tender: getTenderLabel(r.tender as never),
            siteNameRaw: r.siteNameRaw,
            itemDescription: item.itemDescription,
            qty: item.qty ?? '',
            unit: item.unit ?? '',
            perRate: formatCurrency(item.perRate),
            freight: formatCurrency(item.freight),
            labour: formatCurrency(item.labour),
            gstPercent: `${item.gstPercent ?? 0}%`,
            subTotal: formatCurrency(item.subTotal),
            gstAmount: formatCurrency(item.gstAmount),
            lineTotal: formatCurrency(item.grandTotal),
            billSubTotal: formatCurrency(r.subTotal),
            billGstAmount: formatCurrency(r.gstAmount),
            billGrandTotal: formatCurrency(r.grandTotal),
            isHmPurchase: item.isHmPurchase ? 'Yes' : 'No',
            notes: r.notes ?? '',
          })),
        ) as unknown as Record<string, unknown>[],
        'purchases',
      );
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const columns: Column<PurchaseRow>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'billNo', header: 'Bill No', sortable: true },
    { key: 'billName', header: 'Bill Name' },
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
          <button
            className="rounded p-1 hover:bg-blue-50"
            title="View details"
            onClick={() => setInfoId(r._id)}
          >
            <Info className="h-4 w-4 text-blue-600" />
          </button>
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
          placeholder="Search bill no, bill name, item, vendor, site..."
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
          <Select
            label="Vendor"
            options={vendorOptions}
            error={form.formState.errors.vendorNameRaw?.message}
            {...form.register('vendor', {
              onChange: (e) => {
                const selected = vendors.find((v) => v._id === e.target.value);
                form.setValue('vendorNameRaw', selected?.name ?? '', { shouldValidate: true });
              },
            })}
          />
          <input type="hidden" {...form.register('vendorNameRaw')} />
          <Input
            label="Bill No"
            error={form.formState.errors.billNo?.message}
            {...form.register('billNo')}
          />
          <Input
            label="Bill Name"
            error={form.formState.errors.billName?.message}
            {...form.register('billName')}
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

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Receipt (PDF)
            </label>
            {existingAttachments.length > 0 && (
              <ul className="mb-3 space-y-2">
                {existingAttachments.map((attachment, index) => (
                  <li
                    key={attachment._id ?? index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-brand-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {attachment.filename}
                    </a>
                    {editId && attachment._id && (
                      <button
                        type="button"
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteAttachment(attachment._id!)}
                        title="Remove receipt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition hover:border-brand-400 hover:bg-brand-50/30">
              <FileText className="mb-2 h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {receiptFile ? receiptFile.name : 'Click to upload PDF receipt'}
              </span>
              <span className="mt-1 text-xs text-gray-500">PDF only, max 10 MB</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleReceiptChange}
              />
            </label>
            {receiptFile && (
              <button
                type="button"
                className="mt-2 text-sm text-red-600 hover:underline"
                onClick={() => setReceiptFile(null)}
              >
                Remove selected file
              </button>
            )}
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

      <Modal
        open={!!infoId}
        onClose={() => setInfoId(null)}
        title="Purchase Details"
        size="xl"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setInfoId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : detailPurchase ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Serial No" value={detailPurchase.serialNo} />
            <DetailField label="Bill No" value={detailPurchase.billNo} />
            <DetailField label="Bill Name" value={detailPurchase.billName} />
            <DetailField label="Bill Date" value={formatDate(detailPurchase.billDate)} />
            <DetailField label="Vendor Name" value={detailPurchase.vendorNameRaw} />
            <DetailField
              label="Linked Vendor"
              value={getVendorLabel(detailPurchase.vendor as never)}
            />
            <DetailField label="Tender" value={getTenderLabel(detailPurchase.tender as never)} />
            <DetailField label="Site Name" value={detailPurchase.siteNameRaw} />
            <DetailField label="Linked Site" value={getSiteMasterLabel(detailPurchase.site as never)} />
            <DetailField label="Sub Total" value={formatCurrency(detailPurchase.subTotal)} />
            <DetailField label="GST Amount" value={formatCurrency(detailPurchase.gstAmount)} />
            <DetailField label="Grand Total" value={formatCurrency(detailPurchase.grandTotal)} />
            <DetailField label="Created By" value={getCreatedByLabel(detailPurchase.createdBy)} />
            <DetailField label="Created At" value={formatDateTime(detailPurchase.createdAt)} />
            <DetailField label="Updated At" value={formatDateTime(detailPurchase.updatedAt)} />

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">
                {detailPurchase.notes?.trim() || '—'}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Items</dt>
              <dd>
                {detailPurchase.items?.length ? (
                  <div className="space-y-3">
                    {detailPurchase.items.map((item, index) => (
                      <div
                        key={item._id ?? index}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-medium text-gray-900">Item {index + 1}: {item.itemDescription}</p>
                          {item.isHmPurchase && <Badge variant="active">HM</Badge>}
                        </div>
                        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <DetailField
                            label="Linked Item Master"
                            value={getItemMasterLabel(item.item as never)}
                          />
                          <DetailField label="Quantity" value={item.qty ?? '—'} />
                          <DetailField label="Unit" value={item.unit} />
                          <DetailField label="Rate" value={formatCurrency(item.perRate)} />
                          <DetailField label="Freight" value={formatCurrency(item.freight)} />
                          <DetailField label="Labour" value={formatCurrency(item.labour)} />
                          <DetailField label="Sub Total" value={formatCurrency(item.subTotal)} />
                          <DetailField label="GST %" value={`${item.gstPercent}%`} />
                          <DetailField label="GST Amount" value={formatCurrency(item.gstAmount)} />
                          <DetailField label="Line Total" value={formatCurrency(item.grandTotal)} />
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Receipts</dt>
              <dd>
                {detailPurchase.attachments?.length ? (
                  <ul className="space-y-2">
                    {detailPurchase.attachments.map((attachment, index) => (
                      <li
                        key={attachment._id ?? index}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      >
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-medium text-brand-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {attachment.filename}
                        </a>
                        <span className="text-gray-500">{formatDateTime(attachment.uploadedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">Failed to load purchase details.</p>
        )}
      </Modal>
    </PageWrapper>
  );
}
