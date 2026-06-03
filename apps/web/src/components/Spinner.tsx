import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return <Loader2 className={cn('animate-spin text-brand-500', sizes[size], className)} />;
}
