import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { DeveloperCredit } from '@/components/DeveloperCredit';

export interface AppLayoutContext {
  openMobileMenu: () => void;
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Outlet context={{ openMobileMenu: () => setMobileOpen(true) } satisfies AppLayoutContext} />
        <DeveloperCredit className="shrink-0 border-t border-border bg-surface px-4 py-3 sm:px-6" />
      </div>
    </div>
  );
}
