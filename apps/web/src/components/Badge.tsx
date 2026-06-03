import { cn } from '@/lib/cn';

const variants: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  admin: 'bg-brand-100 text-brand-700 border-brand-200',
  data_operator: 'bg-blue-100 text-blue-700 border-blue-200',
  accountant: 'bg-purple-100 text-purple-700 border-purple-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        variants[variant] || variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
