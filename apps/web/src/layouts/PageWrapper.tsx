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
    <>
      <Topbar title={title} onMenuClick={openMobileMenu} actions={actions} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </>
  );
}
