import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type Category, type CreateCategoryInput } from '@gupta/shared';
import { categoriesApi } from '@/api/masters';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Modal } from '@/components/Modal';
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
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            Add Category
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Input
          label="Category Name"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Textarea label="Notes" {...form.register('notes')} />
      </form>
    </Modal>
  );
}
