import { createCategorySchema, type Category } from '@gupta/shared';
import { categoriesApi } from '@/api/masters';
import { MasterCrudPage } from './MasterCrudPage';
import type { Column } from '@/components/DataTable';

const categoryFormFields = [
  { name: 'name', label: 'Category Name' },
  { name: 'notes', label: 'Notes', type: 'textarea' as const },
];

const categoryDetailFields = [
  { name: 'code', label: 'Category Code' },
  ...categoryFormFields,
];

const columns: Column<Category>[] = [
  { key: 'code', header: 'Code', className: 'w-28' },
  { key: 'name', header: 'Category Name' },
];

export default function CategoriesPage() {
  return (
    <MasterCrudPage<Category>
      title="Categories"
      queryKey="categories"
      schema={createCategorySchema}
      defaultValues={{ name: '', notes: '' }}
      fields={categoryFormFields}
      detailFields={categoryDetailFields}
      columns={columns}
      listFn={categoriesApi.list}
      createFn={(data) => categoriesApi.create(data as never)}
      updateFn={(id, data) => categoriesApi.update(id, data as never)}
      removeFn={categoriesApi.remove}
    />
  );
}
