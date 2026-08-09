import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type Category, type CreateCategoryInput } from '@gupta/shared';
import { categoriesApi } from '@/api/masters';
import { Input, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ModalFormFooter } from '@/components/ModalFormFooter';
import { FormSection } from '@/components/FormSection';
import { toast } from '@/lib/notify';

const defaultValues: CreateCategoryInput = {
  name: '',
  notes: '',
};

interface QuickAddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (category: Category) => void;
}

export function QuickAddCategoryModal({ open, onClose, onCreated }: QuickAddCategoryModalProps) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues,
  });

  const close = () => {
    form.reset(defaultValues);
    onClose();
  };

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      const category = await categoriesApi.create(data);
      onCreated(category);
      form.reset(defaultValues);
    } catch {
      toast.error('Failed to create category');
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add New Category"
      size="md"
      nested
      onSubmit={form.handleSubmit(onSubmit)}
      footer={
        <ModalFormFooter
          onCancel={close}
          submitLabel="Add Category"
          loading={form.formState.isSubmitting}
        />
      }
    >
      <div className="space-y-4">
        <FormSection title="Category Details" tone="brand">
          <Input
            label="Category Name"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
        </FormSection>
        <FormSection title="Notes" tone="red">
          <Textarea label="Notes" {...form.register('notes')} />
        </FormSection>
      </div>
    </Modal>
  );
}
