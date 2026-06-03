import { createSiteSchema, type Site } from '@gupta/shared';
import { sitesApi } from '@/api/masters';
import { MasterCrudPage } from './MasterCrudPage';
import type { Column } from '@/components/DataTable';

const columns: Column<Site>[] = [
  { key: 'code', header: 'Code' },
  { key: 'name', header: 'Name' },
  { key: 'location', header: 'Location' },
];

export default function SitesPage() {
  return (
    <MasterCrudPage<Site>
      title="Sites"
      queryKey="sites"
      schema={createSiteSchema}
      defaultValues={{ name: '', code: '', location: '', notes: '' }}
      fields={[
        { name: 'name', label: 'Site Name' },
        { name: 'code', label: 'Site Code' },
        { name: 'location', label: 'Location' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      columns={columns}
      listFn={sitesApi.list}
      createFn={(data) => sitesApi.create(data as never)}
      updateFn={(id, data) => sitesApi.update(id, data as never)}
      removeFn={sitesApi.remove}
    />
  );
}
