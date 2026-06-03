import { createItemSchema, type Item } from '@gupta/shared';
import { itemsApi } from '@/api/masters';
import { MasterCrudPage } from './MasterCrudPage';
import type { Column } from '@/components/DataTable';

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category' },
  { key: 'defaultUnit', header: 'Unit' },
  { key: 'specification', header: 'Specification' },
];

export default function ItemsPage() {
  return (
    <MasterCrudPage<Item>
      title="Items"
      queryKey="items"
      schema={createItemSchema}
      defaultValues={{ name: '', category: '', specification: '', defaultUnit: '', notes: '' }}
      fields={[
        { name: 'name', label: 'Item Name' },
        { name: 'category', label: 'Category' },
        { name: 'defaultUnit', label: 'Default Unit' },
        { name: 'specification', label: 'Specification' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      columns={columns}
      listFn={itemsApi.list}
      createFn={(data) => itemsApi.create(data as never)}
      updateFn={(id, data) => itemsApi.update(id, data as never)}
      removeFn={itemsApi.remove}
    />
  );
}
