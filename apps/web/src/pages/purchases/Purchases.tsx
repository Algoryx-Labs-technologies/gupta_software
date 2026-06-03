import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import {
  createPurchaseSchema,
  computePurchaseTotals,
  type CreatePurchaseInput,
  type Purchase,
} from '@gupta/shared';
import { purchasesApi } from '@/api/purchases';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
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
  site?: { name: string };
};

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search],
    queryFn: () => purchasesApi.list({ page, limit: 20, search: search || undefined }),
  });

  const form = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema) as never,
    defaultValues: {
      vendorNameRaw: '',
      itemDescription: '',
      billNo: '',
      siteNameRaw: '',
      qty: 0,
      unit: 'NOS',
      perRate: 0,
      freight: 0,
      labour: 0,
      gstPercent: 18,
      isHmPurchase: false,
      billDate: new Date(),
    },
  });

  const watched = form.watch(['qty', 'perRate', 'freight', 'labour', 'gstPercent']);
  const totals = computePurchaseTotals({
    qty: watched[0],
    perRate: watched[1],
    freight: watched[2],
    labour: watched[3],
    gstPercent: watched[4],
  });

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
    form.reset();
  };

  const openCreate = () => {
    form.reset({
      vendorNameRaw: '',
      itemDescription: '',
      billNo: '',
      siteNameRaw: '',
      qty: 0,
      unit: 'NOS',
      perRate: 0,
      freight: 0,
      labour: 0,
      gstPercent: 18,
      isHmPurchase: false,
      billDate: new Date(),
    });
    setEditId(null);
    setModalOpen(true);
  };

  const onSubmit = (data: CreatePurchaseInput) => {
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const handleExportExcel = async () => {
    const { data: rows } = await purchasesApi.export({ search: search || undefined });
    exportToExcel(
      rows.map((r) => ({
        'Serial No': r.serialNo,
        Vendor: r.vendorNameRaw,
        Item: r.itemDescription,
        'Bill No': r.billNo,
        Site: r.siteNameRaw,
        Qty: r.qty,
        Unit: r.unit,
        Rate: r.perRate,
        'Grand Total': r.grandTotal,
        Date: formatDate(r.billDate),
      })),
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
        { header: 'Total', dataKey: 'grandTotal' },
      ],
      rows as unknown as Record<string, unknown>[],
      'purchases',
    );
  };

  const columns: Column<PurchaseRow>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'billNo', header: 'Bill No', sortable: true },
    { key: 'billDate', header: 'Date', render: (r) => formatDate(r.billDate) },
    { key: 'vendorNameRaw', header: 'Vendor' },
    { key: 'itemDescription', header: 'Item' },
    { key: 'siteNameRaw', header: 'Site' },
    { key: 'qty', header: 'Qty', render: (r) => `${r.qty ?? '—'} ${r.unit ?? ''}` },
    { key: 'grandTotal', header: 'Total', render: (r) => formatCurrency(r.grandTotal) },
    {
      key: 'isHmPurchase',
      header: 'HM',
      render: (r) => (r.isHmPurchase ? <Badge variant="active">HM</Badge> : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-1">
          <button className="rounded p-1 hover:bg-brand-50" onClick={() => { setEditId(r._id); setModalOpen(true); form.reset(r as unknown as CreatePurchaseInput); }}>
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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button loading={createMutation.isPending || updateMutation.isPending} onClick={form.handleSubmit(onSubmit)}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2">
          <Input label="Vendor Name" error={form.formState.errors.vendorNameRaw?.message} {...form.register('vendorNameRaw')} />
          <Input label="Bill No" error={form.formState.errors.billNo?.message} {...form.register('billNo')} />
          <Input label="Bill Date" type="date" {...form.register('billDate', { valueAsDate: true })} />
          <Input label="Site Name" error={form.formState.errors.siteNameRaw?.message} {...form.register('siteNameRaw')} />
          <div className="sm:col-span-2">
            <Input label="Item Description" error={form.formState.errors.itemDescription?.message} {...form.register('itemDescription')} />
          </div>
          <Input label="Quantity" type="number" step="any" {...form.register('qty', { valueAsNumber: true })} />
          <Input label="Unit" {...form.register('unit')} />
          <Input label="Rate" type="number" step="any" {...form.register('perRate', { valueAsNumber: true })} />
          <Input label="Freight" type="number" step="any" {...form.register('freight', { valueAsNumber: true })} />
          <Input label="Labour" type="number" step="any" {...form.register('labour', { valueAsNumber: true })} />
          <Input label="GST %" type="number" {...form.register('gstPercent', { valueAsNumber: true })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isHmPurchase')} />
            HM Purchase
          </label>
          <div className="sm:col-span-2 rounded-xl bg-brand-50 p-4 text-sm">
            <div className="flex justify-between"><span>Sub Total</span><span>{formatCurrency(totals.subTotal)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>{formatCurrency(totals.gstAmount)}</span></div>
            <div className="mt-1 flex justify-between font-bold"><span>Grand Total</span><span>{formatCurrency(totals.grandTotal)}</span></div>
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
