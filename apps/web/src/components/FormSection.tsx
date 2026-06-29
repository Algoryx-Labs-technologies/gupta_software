import { cn } from '@/lib/cn';

export type FormSectionTone = 'brand' | 'green' | 'red';

const toneStyles: Record<FormSectionTone, string> = {
  brand: 'border-l-4 border-l-brand-500 border border-brand-100 bg-brand-50/50',
  green: 'border-l-4 border-l-green-500 border border-green-100 bg-green-50/50',
  red: 'border-l-4 border-l-red-500 border border-red-100 bg-red-50/40',
};

const titleStyles: Record<FormSectionTone, string> = {
  brand: 'text-brand-800',
  green: 'text-green-800',
  red: 'text-red-800',
};

interface FormSectionProps {
  title: string;
  tone: FormSectionTone;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, tone, children, className }: FormSectionProps) {
  return (
    <section className={cn('rounded-xl p-4', toneStyles[tone], className)}>
      <h3 className={cn('mb-3 text-sm font-semibold', titleStyles[tone])}>{title}</h3>
      {children}
    </section>
  );
}
