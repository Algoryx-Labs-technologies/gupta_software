import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Download, X } from 'lucide-react';
import {
  createTenderSchema,
  TenderStatus,
  type CreateTenderInput,
  type Tender,
  type TenderSiteInput,
} from '@gupta/shared';
import { tendersApi } from '@/api/tenders';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { exportToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';

const statusOptions = Object.values(TenderStatus).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const defaultSite = (): TenderSiteInput => ({
  siteNameRaw: '',
});

const defaultFormValues = (): CreateTenderInput => ({
  tenderName: '',
  tenderNo: '',
  orderValue: 0,
  emd: 0,
  pg: 0,
  sdFromBill: 0,
  paymentReceivedTillDate: 0,
  paymentOutstanding: 0,
  executionPending: 0,
  workCompleted: 0,
  status: TenderStatus.PENDING,
  sites: [defaultSite()],
});

function formatSitesSummary(sites: Tender['sites']) {
  if (!sites?.length) return '—';
  if (sites.length === 1) return sites[0].siteNameRaw;
  return `${sites[0].siteNameRaw} (+${sites.length - 1} more)`;
}

function tenderToFormValues(tender: Tender): CreateTenderInput {
  return {
    tenderName: tender.tenderName,
    tenderNo: tender.tenderNo,
    orderValue: tender.orderValue,
    emd: tender.emd,
    pg: tender.pg,
    sdFromBill: tender.sdFromBill,
    paymentReceivedTillDate: tender.paymentReceivedTillDate,
    paymentOutstanding: tender.paymentOutstanding,
    executionPending: tender.executionPending,
    workCompleted: tender.workCompleted,
    bgNumber: tender.bgNumber,
    bgExpiryDate: tender.bgExpiryDate ? new Date(tender.bgExpiryDate) : undefined,
    status: tender.status,
    notes: tender.notes,
    sites: (tender.sites?.length ? tender.sites : [defaultSite()]).map((site) => ({
      site: typeof site.site === 'string' ? site.site : undefined,
      siteNameRaw: site.siteNameRaw,
    })),
  };
}

function isBgExpiringSoon(date?: string | Date) {
  if (!date) return false;
  const d = new Date(date);
  const days = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 60;
}

export default function TendersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tenders', page, search],
    queryFn: () => tendersApi.list({ page, limit: 20, search: search || undefined }),
  });

  const form = useForm<CreateTenderInput>({
    resolver: zodResolver(createTenderSchema) as never,
    defaultValues: defaultFormValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sites',
  });

  const createMutation = useMutation({
    mutationFn: tendersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender created');
      closeModal();
    },
    onError: () => toast.error('Failed to create tender'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTenderInput }) =>
      tendersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender updated');
      closeModal();
    },
    onError: () => toast.error('Failed to update tender'),
  });

  const deleteMutation = useMutation({
    mutationFn: tendersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setDeleteId(null);
      toast.success('Tender deleted');
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    form.reset(defaultFormValues());
  };

  const openCreate = () => {
    form.reset(defaultFormValues());
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = async (tender: Tender) => {
    try {
      const full = await tendersApi.get(tender._id);
      form.reset(tenderToFormValues(full));
      setEditId(tender._id);
      setModalOpen(true);
    } catch {
      toast.error('Failed to load tender');
    }
  };

  const onSubmit = (data: CreateTenderInput) => {
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const columns: Column<Tender>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'tenderNo', header: 'Tender No' },
    { key: 'tenderName', header: 'Name' },
    {
      key: 'sites',
      header: 'Sites',
      render: (r) => (
        <span title={(r.sites ?? []).map((s) => s.siteNameRaw).join(', ')}>
          {formatSitesSummary(r.sites ?? [])}
        </span>
      ),
    },
    { key: 'orderValue', header: 'Order Value', render: (r) => formatCurrency(r.orderValue) },
    {
      key: 'paymentOutstanding',
      header: 'Outstanding',
      render: (r) => formatCurrency(r.paymentOutstanding),
    },
    { key: 'bgExpiryDate', header: 'BG Expiry', render: (r) => formatDate(r.bgExpiryDate) },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status}>{r.status}</Badge> },
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
      title="Tenders"
      actions={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const { data: rows } = await tendersApi.export();
              exportToExcel(
                rows.flatMap((r) =>
                  (r.sites?.length ? r.sites : [{ siteNameRaw: '—' }]).map((site) => ({
                    ...r,
                    site: site.siteNameRaw,
                    bgExpiryDate: formatDate(r.bgExpiryDate),
                  })),
                ),
                'tenders',
              );
            }}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Tender
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search tenders, sites..."
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
        rowClassName={(r) => (isBgExpiringSoon(r.bgExpiryDate) ? 'bg-amber-50/60' : '')}
        keyExtractor={(r) => r._id}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? 'Edit Tender' : 'Add Tender'}
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
          <Input label="Tender Name" {...form.register('tenderName')} />
          <Input label="Tender No" {...form.register('tenderNo')} />
          <Input label="Order Value" type="number" {...form.register('orderValue', { valueAsNumber: true })} />
          <Input label="EMD" type="number" {...form.register('emd', { valueAsNumber: true })} />
          <Input label="PG" type="number" {...form.register('pg', { valueAsNumber: true })} />
          <Input label="SD from Bill" type="number" {...form.register('sdFromBill', { valueAsNumber: true })} />
          <Input
            label="Payment Received"
            type="number"
            {...form.register('paymentReceivedTillDate', { valueAsNumber: true })}
          />
          <Input
            label="Outstanding"
            type="number"
            {...form.register('paymentOutstanding', { valueAsNumber: true })}
          />
          <Input
            label="Execution Pending"
            type="number"
            {...form.register('executionPending', { valueAsNumber: true })}
          />
          <Input label="Work Completed" type="number" {...form.register('workCompleted', { valueAsNumber: true })} />
          <Input label="BG Number" {...form.register('bgNumber')} />
          <Input label="BG Expiry" type="date" {...form.register('bgExpiryDate', { valueAsDate: true })} />
          <Select label="Status" options={statusOptions} {...form.register('status')} />

          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Sites</h3>
              <Button type="button" variant="secondary" onClick={() => append(defaultSite())}>
                <Plus className="h-4 w-4" /> Add Site
              </Button>
            </div>

            {form.formState.errors.sites?.message && (
              <p className="text-sm text-red-500">{form.formState.errors.sites.message}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Site {index + 1}</span>
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
                <Input
                  label="Site Name"
                  error={form.formState.errors.sites?.[index]?.siteNameRaw?.message}
                  {...form.register(`sites.${index}.siteNameRaw`)}
                />
              </div>
            ))}
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
        title="Delete Tender"
        message="Are you sure you want to delete this tender?"
      />
    </PageWrapper>
  );
}
