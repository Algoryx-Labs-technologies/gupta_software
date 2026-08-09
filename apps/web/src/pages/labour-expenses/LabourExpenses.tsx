import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  createLabourExpenseSchema,
  LabourExpenseCategory,
  LABOUR_EXPENSE_CATEGORY_LABELS,
  resolveCategoryLabel,
  type CreateLabourExpenseInput,
  type LabourExpensePopulated,
  type Tender,
  type TenderSite,
} from '@gupta/shared';
import { labourExpensesApi } from '@/api/labourExpenses';
import { tendersApi } from '@/api/tenders';
import { dashboardApi } from '@/api/dashboard';
import { PageWrapper } from '@/layouts/PageWrapper';
import { Button } from '@/components/Button';
import { Input, Select } from '@/components/Input';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { ModalFormFooter } from '@/components/ModalFormFooter';
import { FormSection } from '@/components/FormSection';
import { DataTable, type Column } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from '@/lib/notify';

type PopulatedTenderSite = TenderSite & {
  site?: string | { _id: string; name: string; code: string };
};

type TenderOption = Tender & {
  sites: PopulatedTenderSite[];
};

type ExpenseRow = LabourExpensePopulated;

const categoryOptions = Object.values(LabourExpenseCategory).map((value) => ({
  value,
  label: LABOUR_EXPENSE_CATEGORY_LABELS[value],
}));

function getSiteRefId(siteRef?: string | { _id: string }): string | undefined {
  if (!siteRef) return undefined;
  return typeof siteRef === 'string' ? siteRef : siteRef._id;
}

function getTenderSiteKey(site: PopulatedTenderSite): string {
  return getSiteRefId(site.site) ?? `name:${site.siteNameRaw}`;
}

function getTenderLabel(tender: ExpenseRow['tender']): string {
  if (!tender || typeof tender === 'string') return '—';
  if (tender.tenderNo && tender.tenderName) return `${tender.tenderNo} — ${tender.tenderName}`;
  return tender.tenderNo ?? tender.tenderName ?? '—';
}

const defaultFormValues = (): CreateLabourExpenseInput => ({
  tender: '',
  siteNameRaw: '',
  category: LabourExpenseCategory.FOOD,
  categoryOther: '',
  amount: 0,
  expenseDate: new Date(),
});

export default function LabourExpensesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSiteKey, setSelectedSiteKey] = useState('');

  const dateParams = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard', 'labour-expenses-summary', dateFrom, dateTo],
    queryFn: () => dashboardApi.summary(dateParams),
    select: (d) => d.labourExpenses,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['labour-expenses', page, dateFrom, dateTo, categoryFilter],
    queryFn: () =>
      labourExpensesApi.list({
        page,
        limit: 20,
        ...dateParams,
        ...(categoryFilter && { category: categoryFilter }),
      }),
  });

  const { data: tendersData } = useQuery({
    queryKey: ['tenders', 'labour-expense-form'],
    queryFn: () => tendersApi.list({ limit: 100, sortBy: 'tenderName', sortOrder: 'asc' }),
    enabled: modalOpen,
  });

  const tenders = (tendersData?.data ?? []) as TenderOption[];

  const form = useForm<CreateLabourExpenseInput>({
    resolver: zodResolver(createLabourExpenseSchema) as never,
    defaultValues: defaultFormValues(),
  });

  const selectedTenderId = form.watch('tender');
  const selectedCategory = form.watch('category');
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

  const createMutation = useMutation({
    mutationFn: labourExpensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['labour-expenses'] });
      toast.success('Labour expense added');
      closeModal();
    },
    onError: () => toast.error('Failed to add labour expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: labourExpensesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['labour-expenses'] });
      toast.success('Labour expense deleted');
      setDeleteId(null);
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    form.reset(defaultFormValues());
    setSelectedSiteKey('');
  };

  const openCreate = () => {
    form.reset(defaultFormValues());
    setSelectedSiteKey('');
    setModalOpen(true);
  };

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

    form.setValue('site', getSiteRefId(siteEntry.site), { shouldValidate: true });
    form.setValue('siteNameRaw', siteEntry.siteNameRaw, { shouldValidate: true });
  };

  const columns: Column<ExpenseRow>[] = [
    {
      key: 'expenseDate',
      header: 'Date',
      render: (r) => formatDate(r.expenseDate),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) =>
        resolveCategoryLabel(r.category, r.categoryOther, LABOUR_EXPENSE_CATEGORY_LABELS),
    },
    {
      key: 'tender',
      header: 'Tender',
      render: (r) => getTenderLabel(r.tender),
    },
    {
      key: 'siteNameRaw',
      header: 'Site',
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => r.description || '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => formatCurrency(r.amount),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          className="rounded p-1 hover:bg-red-50"
          onClick={() => setDeleteId(r._id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Labour Expense"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="!w-auto"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="!w-auto"
          />
          <Select
            options={[
              { value: '', label: 'All categories' },
              ...Object.values(LabourExpenseCategory).map((value) => ({
                value,
                label: LABOUR_EXPENSE_CATEGORY_LABELS[value],
              })),
            ]}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="!w-44"
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      }
    >
      {summaryData && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl bg-brand-50 px-4 py-2">
            <span className="text-muted">Total: </span>
            <span className="font-semibold">{formatCurrency(summaryData.totalAmount)}</span>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-2">
            <span className="text-muted">Entries: </span>
            <span className="font-semibold">{summaryData.totalCount}</span>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as unknown as ExpenseRow[]}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPageChange={setPage}
        emptyTitle="No labour expenses"
        emptyDescription="Click Add to record a labour expense"
        keyExtractor={(r) => r._id}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Add Labour Expense"
        size="lg"
        onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
        footer={
          <ModalFormFooter
            onCancel={closeModal}
            loading={createMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <FormSection title="Tender & Site" tone="brand">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </FormSection>
          <FormSection title="Expense Details" tone="green">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                options={categoryOptions}
                error={form.formState.errors.category?.message}
                {...form.register('category', {
                  onChange: () => {
                    if (form.getValues('category') !== LabourExpenseCategory.OTHER) {
                      form.setValue('categoryOther', '');
                    }
                  },
                })}
              />
              {selectedCategory === LabourExpenseCategory.OTHER && (
                <Input
                  label="Specify category"
                  placeholder="e.g. Transport, Tools"
                  error={form.formState.errors.categoryOther?.message}
                  {...form.register('categoryOther')}
                />
              )}
              <Input
                label="Amount"
                type="number"
                step="any"
                error={form.formState.errors.amount?.message}
                {...form.register('amount', { valueAsNumber: true })}
              />
              <Input
                label="Expense Date"
                type="date"
                error={form.formState.errors.expenseDate?.message}
                {...form.register('expenseDate', { valueAsDate: true })}
              />
            </div>
          </FormSection>
          <FormSection title="Description" tone="red">
            <Input
              label="Description"
              placeholder="Brief description"
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Labour Expense"
        message="Are you sure you want to delete this labour expense?"
      />
    </PageWrapper>
  );
}
