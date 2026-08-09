import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Key, Trash2 } from 'lucide-react';
import { createUserSchema, ROLE_LABELS, Role, type User, type CreateUserInput } from '@gupta/shared';
import { usersApi } from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Select } from '@/components/Input';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { ModalFormFooter } from '@/components/ModalFormFooter';
import { FormSection } from '@/components/FormSection';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/formatters';
import { toast } from '@/lib/notify';

const roleOptions = [Role.DATA_OPERATOR, Role.ACCOUNTANT].map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list({ page, limit: 20 }),
  });

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: Role.DATA_OPERATOR as const },
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      setCreateOpen(false);
      form.reset();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) =>
      usersApi.updateStatus(id, disabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status updated');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role.DATA_OPERATOR | Role.ACCOUNTANT }) =>
      usersApi.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApi.resetPassword(id, password),
    onSuccess: () => {
      toast.success('Password reset');
      setResetId(null);
      setNewPassword('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setDeleteUser(null);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (r) => (
        <select
          value={r.role}
          onChange={(e) =>
            roleMutation.mutate({
              id: r._id,
              role: e.target.value as Role.DATA_OPERATOR | Role.ACCOUNTANT,
            })
          }
          className="rounded-lg border border-border px-2 py-1 text-sm"
        >
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'disabled',
      header: 'Status',
      render: (r) => (
        <button
          onClick={() => statusMutation.mutate({ id: r._id, disabled: !r.disabled })}
          className="text-sm"
        >
          <Badge variant={r.disabled ? 'cancelled' : 'completed'}>
            {r.disabled ? 'Disabled' : 'Active'}
          </Badge>
        </button>
      ),
    },
    { key: 'lastLoginAt', header: 'Last Login', render: (r) => formatDate(r.lastLoginAt) },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-1">
          <button
            className="rounded p-1 hover:bg-brand-50"
            onClick={() => setResetId(r._id)}
            title="Reset password"
          >
            <Key className="h-4 w-4" />
          </button>
          {currentUser?._id !== r._id && (
            <button
              className="rounded p-1 hover:bg-red-50"
              onClick={() => setDeleteUser(r)}
              title="Delete user"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Team & Roles"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        keyExtractor={(r) => r._id}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User"
        onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
        footer={
          <ModalFormFooter
            onCancel={() => setCreateOpen(false)}
            loading={createMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <FormSection title="User Details" tone="brand">
            <div className="space-y-4">
              <Input label="Name" {...form.register('name')} />
              <Input label="Email" type="email" {...form.register('email')} />
            </div>
          </FormSection>
          <FormSection title="Access" tone="green">
            <div className="space-y-4">
              <Input label="Password" type="password" {...form.register('password')} />
              <Select label="Role" options={roleOptions} {...form.register('role')} />
            </div>
          </FormSection>
        </div>
      </Modal>

      <Modal
        open={!!resetId}
        onClose={() => setResetId(null)}
        title="Reset Password"
        footer={
          <Button
            onClick={() => resetId && resetMutation.mutate({ id: resetId, password: newPassword })}
            loading={resetMutation.isPending}
          >
            Reset Password
          </Button>
        }
      >
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser._id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={
          deleteUser
            ? `Are you sure you want to delete ${deleteUser.name} (${deleteUser.email})? This cannot be undone.`
            : ''
        }
      />
    </PageWrapper>
  );
}
