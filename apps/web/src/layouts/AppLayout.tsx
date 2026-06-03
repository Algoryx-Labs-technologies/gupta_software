import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

export interface AppLayoutContext {
  openMobileMenu: () => void;
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet context={{ openMobileMenu: () => setMobileOpen(true) } satisfies AppLayoutContext} />
      </div>
    </div>
  );
}
