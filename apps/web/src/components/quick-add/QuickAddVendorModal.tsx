import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createVendorSchema, type CreateVendorInput, type Vendor } from '@gupta/shared';
import { vendorsApi } from '@/api/masters';
import { Input, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ModalFormFooter } from '@/components/ModalFormFooter';
import { FormSection } from '@/components/FormSection';
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
        <ModalFormFooter
          onCancel={close}
          onSubmit={form.handleSubmit(onSubmit)}
          submitLabel="Add Vendor"
          loading={form.formState.isSubmitting}
        />
      }
    >
      <form className="space-y-4">
        <FormSection title="Vendor Details" tone="brand">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Vendor Name"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <Input label="Contact Person Name" {...form.register('contactPerson')} />
            <Input label="Mobile" {...form.register('phone')} />
            <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
          </div>
        </FormSection>
        <FormSection title="Tax & Address" tone="green">
          <div className="space-y-4">
            <Input label="GSTIN" {...form.register('gstin')} />
            <Textarea label="Address" {...form.register('address')} />
          </div>
        </FormSection>
        <FormSection title="Notes" tone="red">
          <Textarea label="Notes" {...form.register('notes')} />
        </FormSection>
      </form>
    </Modal>
  );
}
