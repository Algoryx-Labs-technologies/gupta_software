export function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-IN').format(value ?? 0);
}
