import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="card relative overflow-hidden">
      {accent && (
        <div className="absolute left-0 top-0 h-1 w-full bg-brand-gradient" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div
          className={cn(
            'rounded-xl p-3',
            accent ? 'bg-brand-gradient text-white' : 'bg-brand-50 text-brand-500',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
