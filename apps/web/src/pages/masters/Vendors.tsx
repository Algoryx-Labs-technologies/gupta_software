import { createVendorSchema, type Vendor } from '@gupta/shared';
import { vendorsApi } from '@/api/masters';
import { MasterCrudPage } from './MasterCrudPage';
import type { Column } from '@/components/DataTable';

const vendorFields = [
  { name: 'name', label: 'Vendor Name' },
  { name: 'contactPerson', label: 'Contact Person Name' },
  { name: 'phone', label: 'Mobile' },
  { name: 'email', label: 'Email' },
  { name: 'gstin', label: 'GSTIN' },
  { name: 'address', label: 'Address', type: 'textarea' as const },
  { name: 'notes', label: 'Notes', type: 'textarea' as const },
];

const columns: Column<Vendor>[] = [
  { key: 'name', header: 'Vendor Name' },
  { key: 'contactPerson', header: 'Contact Person Name' },
  { key: 'phone', header: 'Mobile' },
];

export default function VendorsPage() {
  return (
    <MasterCrudPage<Vendor>
      title="Vendors"
      queryKey="vendors"
      schema={createVendorSchema}
      defaultValues={{ name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', notes: '' }}
      fields={vendorFields}
      detailFields={vendorFields}
      columns={columns}
      listFn={vendorsApi.list}
      createFn={(data) => vendorsApi.create(data as never)}
      updateFn={(id, data) => vendorsApi.update(id, data as never)}
      removeFn={vendorsApi.remove}
    />
  );
}
