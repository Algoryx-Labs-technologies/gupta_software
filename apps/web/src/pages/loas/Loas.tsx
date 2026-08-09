import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Info, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createLoaSchema,
  type Attachment,
  type CreateLoaInput,
  type LoaPopulated,
} from '@gupta/shared';
import { loasApi } from '@/api/loas';
import { tendersApi } from '@/api/tenders';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { ModalFormFooter } from '@/components/ModalFormFooter';
import { FormSection } from '@/components/FormSection';
import { DataTable, type Column } from '@/components/DataTable';
import { Spinner } from '@/components/Spinner';
import { formatDate, formatTime } from '@/lib/formatters';
import { toast } from '@/lib/notify';

type LoaRow = LoaPopulated;

function getTenderLabel(
  tender?: LoaRow['tender'] | string | null,
): string {
  if (!tender) return '—';
  if (typeof tender === 'string') return tender;
  if (tender.tenderNo && tender.tenderName) return `${tender.tenderNo} — ${tender.tenderName}`;
  return tender.tenderNo ?? tender.tenderName ?? '—';
}

function formatDateTime(date: string | Date | undefined | null) {
  if (!date) return '—';
  return `${formatDate(date)} ${formatTime(date)}`;
}

const defaultFormValues = (): CreateLoaInput => ({
  loaNumber: '',
  loaDate: new Date(),
  title: '',
  tender: undefined,
  notes: '',
});

export default function LoasPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['loas', page, search],
    queryFn: () =>
      loasApi.list({
        page,
        limit: 20,
        search: search || undefined,
        sortBy: 'loaDate',
        sortOrder: 'desc',
      }),
  });

  const { data: detailLoa, isLoading: detailLoading } = useQuery({
    queryKey: ['loas', infoId],
    queryFn: () => loasApi.get(infoId!),
    enabled: !!infoId,
  });

  const { data: tendersData } = useQuery({
    queryKey: ['tenders', 'loa-form'],
    queryFn: () => tendersApi.list({ limit: 100, sortBy: 'tenderName', sortOrder: 'asc' }),
    enabled: modalOpen,
  });

  const tenders = tendersData?.data ?? [];

  const tenderOptions = useMemo(
    () => [
      { value: '', label: 'No tender linked' },
      ...tenders.map((t) => ({
        value: t._id,
        label: t.code
          ? `${t.code} — ${t.tenderNo} — ${t.tenderName}`
          : `${t.tenderNo} — ${t.tenderName}`,
      })),
    ],
    [tenders],
  );

  const form = useForm<CreateLoaInput>({
    resolver: zodResolver(createLoaSchema) as never,
    defaultValues: defaultFormValues(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['loas'] });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setPdfFile(null);
    setExistingAttachments([]);
    form.reset(defaultFormValues());
  };

  const openCreate = () => {
    form.reset(defaultFormValues());
    setEditId(null);
    setPdfFile(null);
    setExistingAttachments([]);
    setModalOpen(true);
  };

  const openEdit = async (row: LoaRow) => {
    try {
      const full = await loasApi.get(row._id);
      const tenderId =
        typeof full.tender === 'string'
          ? full.tender
          : full.tender && typeof full.tender === 'object'
            ? (full.tender as { _id: string })._id
            : undefined;

      form.reset({
        loaNumber: full.loaNumber,
        loaDate: new Date(full.loaDate),
        title: full.title ?? '',
        tender: tenderId,
        notes: full.notes ?? '',
      });
      setEditId(full._id);
      setPdfFile(null);
      setExistingAttachments(full.attachments ?? []);
      setModalOpen(true);
    } catch {
      toast.error('Failed to load LOA');
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      return;
    }
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error('Only PDF documents are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF must be under 10 MB');
      e.target.value = '';
      return;
    }
    setPdfFile(file);
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!editId) return;
    try {
      const updated = await loasApi.deleteAttachment(editId, attId);
      setExistingAttachments(updated.attachments ?? []);
      invalidate();
      toast.success('Document removed');
    } catch {
      toast.error('Failed to remove document');
    }
  };

  const createMutation = useMutation({
    mutationFn: loasApi.create,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLoaInput }) => loasApi.update(id, data),
  });

  const deleteMutation = useMutation({
    mutationFn: loasApi.remove,
    onSuccess: () => {
      invalidate();
      toast.success('LOA deleted');
      setDeleteId(null);
    },
  });

  const onSubmit = async (data: CreateLoaInput) => {
    const payload: CreateLoaInput = {
      ...data,
      tender: data.tender || undefined,
      title: data.title?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        if (pdfFile) {
          const updated = await loasApi.uploadAttachment(editId, pdfFile);
          setExistingAttachments(updated.attachments ?? []);
        }
        invalidate();
        toast.success('LOA updated');
        closeModal();
      } else {
        const loa = await createMutation.mutateAsync(payload);
        if (pdfFile) {
          await loasApi.uploadAttachment(loa._id, pdfFile);
        }
        invalidate();
        toast.success('LOA created');
        closeModal();
      }
    } catch {
      toast.error(editId ? 'Failed to update LOA' : 'Failed to create LOA');
    }
  };

  const columns: Column<LoaRow>[] = [
    { key: 'serialNo', header: '#', className: 'w-12' },
    { key: 'loaNumber', header: 'LOA No' },
    {
      key: 'loaDate',
      header: 'Date',
      render: (r) => formatDate(r.loaDate),
    },
    {
      key: 'title',
      header: 'Title',
      render: (r) => r.title || '—',
    },
    {
      key: 'tender',
      header: 'Tender',
      render: (r) => getTenderLabel(r.tender),
    },
    {
      key: 'attachments',
      header: 'PDFs',
      render: (r) => r.attachments?.length || 0,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded p-1 hover:bg-blue-50"
            title="View details"
            onClick={() => setInfoId(r._id)}
          >
            <Info className="h-4 w-4 text-blue-600" />
          </button>
          <button
            type="button"
            className="rounded p-1 hover:bg-brand-50"
            title="Edit"
            onClick={() => openEdit(r)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1 hover:bg-red-50"
            title="Delete"
            onClick={() => setDeleteId(r._id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="LOA"
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add LOA
        </Button>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search LOA no, title, notes..."
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
        data={(data?.data ?? []) as LoaRow[]}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPageChange={setPage}
        emptyTitle="No LOAs"
        emptyDescription="Click Add LOA to upload a letter of acceptance"
        keyExtractor={(r) => r._id}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? 'Edit LOA' : 'Add LOA'}
        size="lg"
        onSubmit={form.handleSubmit(onSubmit)}
        footer={
          <ModalFormFooter
            onCancel={closeModal}
            submitLabel={editId ? 'Update' : 'Create'}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <FormSection title="LOA Details" tone="brand">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="LOA Number"
                error={form.formState.errors.loaNumber?.message}
                {...form.register('loaNumber')}
              />
              <Input
                label="LOA Date"
                type="date"
                error={form.formState.errors.loaDate?.message}
                {...form.register('loaDate', { valueAsDate: true })}
              />
              <Input
                label="Title"
                placeholder="Optional subject / title"
                error={form.formState.errors.title?.message}
                {...form.register('title')}
              />
              <Select
                label="Linked Tender"
                options={tenderOptions}
                value={form.watch('tender') ?? ''}
                onChange={(e) =>
                  form.setValue('tender', e.target.value || undefined, { shouldValidate: true })
                }
                error={form.formState.errors.tender?.message}
              />
            </div>
          </FormSection>

          <FormSection title="Notes" tone="green">
            <Textarea label="Notes" {...form.register('notes')} />
          </FormSection>

          <FormSection title="LOA Document (PDF)" tone="red">
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
                        title="Remove document"
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
                {pdfFile ? pdfFile.name : 'Click to upload PDF'}
              </span>
              <span className="mt-1 text-xs text-gray-500">PDF only, max 10 MB</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfChange}
              />
            </label>
            {pdfFile && (
              <button
                type="button"
                className="mt-2 text-sm text-red-600 hover:underline"
                onClick={() => setPdfFile(null)}
              >
                Remove selected file
              </button>
            )}
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete LOA"
        message="Are you sure you want to delete this LOA and its uploaded documents?"
      />

      <Modal
        open={!!infoId}
        onClose={() => setInfoId(null)}
        title="LOA Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setInfoId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : detailLoa ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Serial No</dt>
              <dd className="mt-1 text-sm text-gray-900">{detailLoa.serialNo}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">LOA Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{detailLoa.loaNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">LOA Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(detailLoa.loaDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{detailLoa.title || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Tender</dt>
              <dd className="mt-1 text-sm text-gray-900">{getTenderLabel(detailLoa.tender as never)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">
                {detailLoa.notes?.trim() || '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Documents
              </dt>
              <dd>
                {detailLoa.attachments?.length ? (
                  <ul className="space-y-2">
                    {detailLoa.attachments.map((attachment, index) => (
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
          <p className="py-8 text-center text-sm text-gray-500">Failed to load LOA details.</p>
        )}
      </Modal>
    </PageWrapper>
  );
}
