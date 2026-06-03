import { createVendorSchema, type Vendor } from '@gupta/shared';
import { vendorsApi } from '@/api/masters';
import { MasterCrudPage } from './MasterCrudPage';
import type { Column } from '@/components/DataTable';

const columns: Column<Vendor>[] = [
  { key: 'name', header: 'Name' },
  { key: 'contactPerson', header: 'Contact' },
  { key: 'phone', header: 'Phone' },
  { key: 'gstin', header: 'GSTIN' },
];

export default function VendorsPage() {
  return (
    <MasterCrudPage<Vendor>
      title="Vendors"
      queryKey="vendors"
      schema={createVendorSchema}
      defaultValues={{ name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', notes: '' }}
      fields={[
        { name: 'name', label: 'Vendor Name' },
        { name: 'contactPerson', label: 'Contact Person' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'address', label: 'Address', type: 'textarea' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      columns={columns}
      listFn={vendorsApi.list}
      createFn={(data) => vendorsApi.create(data as never)}
      updateFn={(id, data) => vendorsApi.update(id, data as never)}
      removeFn={vendorsApi.remove}
    />
  );
}
