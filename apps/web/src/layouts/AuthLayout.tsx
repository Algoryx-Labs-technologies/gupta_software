import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { DeveloperCredit } from '@/components/DeveloperCredit';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col items-center justify-center bg-brand-gradient p-12 text-center text-white lg:flex">
        <Logo size="xl" className="mb-8" />
        <p className="max-w-md text-lg text-white/90">
          Inventory, Purchase & Tender Management for construction procurement across multiple
          sites.
        </p>
      </div>
      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        <DeveloperCredit className="mx-auto mt-6 shrink-0" />
      </div>
    </div>
  );
}
