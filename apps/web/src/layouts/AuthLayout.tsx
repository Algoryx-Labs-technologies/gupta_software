import { Outlet } from 'react-router-dom';
import { Package2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-center bg-brand-gradient p-12 text-white lg:flex">
        <Package2 className="mb-6 h-12 w-12" />
        <h1 className="text-4xl font-bold">Gupta Traders</h1>
        <p className="mt-4 max-w-md text-lg text-white/90">
          Inventory, Purchase & Tender Management for construction procurement across multiple
          sites.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
