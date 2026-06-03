import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { z } from 'zod';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { DataTable, type Column } from '@/components/DataTable';
import { toast } from 'sonner';
import type { PaginatedResponse } from '@gupta/shared';

interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'textarea';
}

interface MasterCrudPageProps<T extends { _id: string }> {
  title: string;
  queryKey: string;
  schema: z.ZodType;
  defaultValues: Record<string, unknown>;
  fields: FieldConfig[];
  columns: Column<T>[];
  listFn: (params: Record<string, unknown>) => Promise<PaginatedResponse<T>>;
  createFn: (data: Record<string, unknown>) => Promise<T>;
  updateFn: (id: string, data: Record<string, unknown>) => Promise<T>;
  removeFn: (id: string) => Promise<unknown>;
}

export function MasterCrudPage<T extends { _id: string }>({
  title,
  queryKey,
  schema,
  defaultValues,
  fields,
  columns,
  listFn,
  createFn,
  updateFn,
  removeFn,
}: MasterCrudPageProps<T>) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => listFn({ page, limit: 20, search: search || undefined }),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${title.slice(0, -1)} created`);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Record<string, unknown> }) => updateFn(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${title.slice(0, -1)} updated`);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteId(null);
      toast.success('Deleted');
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    form.reset(defaultValues);
  };

  const actionColumn: Column<T> = {
    key: 'actions',
    header: '',
    render: (row) => (
      <div className="flex gap-1">
        <button
          className="rounded p-1 hover:bg-brand-50"
          onClick={() => {
            setEditId(row._id);
            form.reset(row as unknown as Record<string, unknown>);
            setModalOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button className="rounded p-1 hover:bg-red-50" onClick={() => setDeleteId(row._id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    ),
  };

  return (
    <PageWrapper
      title={title}
      actions={
        <Button
          onClick={() => {
            form.reset(defaultValues);
            setEditId(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      }
    >
      <div className="mb-4">
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={[...columns, actionColumn]}
        data={data?.data ?? []}
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
        title={editId ? `Edit` : `Add`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={form.handleSubmit((d) =>
                editId
                  ? updateMutation.mutate({ id: editId, data: d as Record<string, unknown> })
                  : createMutation.mutate(d as Record<string, unknown>),
              )}
            >
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          {fields.map((f) =>
            f.type === 'textarea' ? (
              <Textarea key={f.name} label={f.label} {...form.register(f.name)} />
            ) : (
              <Input key={f.name} label={f.label} {...form.register(f.name)} />
            ),
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Confirm Delete"
        message="Are you sure you want to delete this record?"
      />
    </PageWrapper>
  );
}
