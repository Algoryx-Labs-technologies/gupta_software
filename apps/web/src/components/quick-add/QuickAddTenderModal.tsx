import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import {
  createTenderSchema,
  TenderStatus,
  type CreateTenderInput,
  type Tender,
  type TenderSiteInput,
} from '@gupta/shared';
import { tendersApi } from '@/api/tenders';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { toast } from '@/lib/notify';

const statusOptions = Object.values(TenderStatus).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const defaultSite = (): TenderSiteInput => ({
  siteNameRaw: '',
});

const defaultValues = (): CreateTenderInput => ({
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

interface QuickAddTenderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (tender: Tender) => void;
}

export function QuickAddTenderModal({ open, onClose, onCreated }: QuickAddTenderModalProps) {
  const form = useForm<CreateTenderInput>({
    resolver: zodResolver(createTenderSchema) as never,
    defaultValues: defaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sites',
  });

  const close = () => {
    form.reset(defaultValues());
    onClose();
  };

  const onSubmit = async (data: CreateTenderInput) => {
    try {
      const tender = await tendersApi.create(data);
      const full = await tendersApi.get(tender._id);
      onCreated(full);
      form.reset(defaultValues());
    } catch {
      toast.error('Failed to create tender');
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add New Tender"
      size="xl"
      nested
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            Add Tender
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
  );
}
