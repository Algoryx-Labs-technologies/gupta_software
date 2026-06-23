import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createVendorSchema, type CreateVendorInput, type Vendor } from '@gupta/shared';
import { vendorsApi } from '@/api/masters';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { toast } from '@/lib/notify';

const defaultValues: CreateVendorInput = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  address: '',
  notes: '',
};

interface QuickAddVendorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}

export function QuickAddVendorModal({ open, onClose, onCreated }: QuickAddVendorModalProps) {
  const form = useForm<CreateVendorInput>({
    resolver: zodResolver(createVendorSchema),
    defaultValues,
  });

  const close = () => {
    form.reset(defaultValues);
    onClose();
  };

  const onSubmit = async (data: CreateVendorInput) => {
    try {
      const vendor = await vendorsApi.create(data);
      onCreated(vendor);
      form.reset(defaultValues);
    } catch {
      toast.error('Failed to create vendor');
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add New Vendor"
      size="lg"
      nested
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            Add Vendor
          </Button>
        </div>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Vendor Name"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Input label="Contact Person Name" {...form.register('contactPerson')} />
        <Input label="Mobile" {...form.register('phone')} />
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="GSTIN" {...form.register('gstin')} />
        <div className="sm:col-span-2">
          <Textarea label="Address" {...form.register('address')} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Notes" {...form.register('notes')} />
        </div>
      </form>
    </Modal>
  );
}
