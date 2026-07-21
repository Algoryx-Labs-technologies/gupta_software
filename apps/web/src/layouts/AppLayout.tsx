import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export interface AppLayoutContext {
  openMobileMenu: () => void;
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet context={{ openMobileMenu: () => setMobileOpen(true) } satisfies AppLayoutContext} />
      </div>
    </div>
  );
}
