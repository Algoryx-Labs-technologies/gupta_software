import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { ROLE_LABELS } from '@gupta/shared';
import type { Role } from '@gupta/shared';
import { Badge } from './Badge';
import { MobileMenuButton } from './Sidebar';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, onMenuClick, actions }: TopbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileMenuButton onClick={onMenuClick} />
        <h1 className="text-lg font-semibold text-gray-900 md:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 hover:bg-brand-50"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <Badge variant={user?.role}>{ROLE_LABELS[user?.role as Role]}</Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-surface py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
