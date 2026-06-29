import { useOutletContext } from 'react-router-dom';
import { Topbar } from '@/components/Topbar';
import type { AppLayoutContext } from '@/layouts/AppLayout';

export function PageWrapper({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { openMobileMenu } = useOutletContext<AppLayoutContext>();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title={title} onMenuClick={openMobileMenu} actions={actions} />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
