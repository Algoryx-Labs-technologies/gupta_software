import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import {
  createTenderSchema,
  TenderStatus,
  type CreateTenderInput,
  type Tender,
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
    defaultValues: {
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
    },
  });

  const createMutation = useMutation({
    mutationFn: tendersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender created');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTenderInput }) => tendersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender updated');
      closeModal();
    },
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
    form.reset();
  };

  const columns: Column<Tender>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'tenderNo', header: 'Tender No' },
    { key: 'tenderName', header: 'Name' },
    { key: 'orderValue', header: 'Order Value', render: (r) => formatCurrency(r.orderValue) },
    { key: 'paymentOutstanding', header: 'Outstanding', render: (r) => formatCurrency(r.paymentOutstanding) },
    { key: 'bgExpiryDate', header: 'BG Expiry', render: (r) => formatDate(r.bgExpiryDate) },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-1">
          <button className="rounded p-1 hover:bg-brand-50" onClick={() => { setEditId(r._id); form.reset(r as unknown as CreateTenderInput); setModalOpen(true); }}>
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
              exportToExcel(rows.map((r) => ({ ...r, bgExpiryDate: formatDate(r.bgExpiryDate) })), 'tenders');
            }}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => { form.reset(); setEditId(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Tender
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Input placeholder="Search tenders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-md" />
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
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={form.handleSubmit((d) => editId ? updateMutation.mutate({ id: editId, data: d }) : createMutation.mutate(d))}
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
          <Input label="Payment Received" type="number" {...form.register('paymentReceivedTillDate', { valueAsNumber: true })} />
          <Input label="Outstanding" type="number" {...form.register('paymentOutstanding', { valueAsNumber: true })} />
          <Input label="Execution Pending" type="number" {...form.register('executionPending', { valueAsNumber: true })} />
          <Input label="Work Completed" type="number" {...form.register('workCompleted', { valueAsNumber: true })} />
          <Input label="BG Number" {...form.register('bgNumber')} />
          <Input label="BG Expiry" type="date" {...form.register('bgExpiryDate', { valueAsDate: true })} />
          <Select label="Status" options={statusOptions} {...form.register('status')} />
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
