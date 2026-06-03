import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Spinner } from './Spinner';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowClassName?: (row: T) => string;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  page = 1,
  totalPages = 1,
  total,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  emptyTitle = 'No records found',
  emptyDescription,
  rowClassName,
  keyExtractor,
}: DataTableProps<T>) {
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-brand-500" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-brand-500" />
    );
  };

  return (
    <div className="card overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-brand-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-medium text-gray-700',
                    col.sortable && 'cursor-pointer select-none hover:text-brand-600',
                    col.className,
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'border-b border-border/60 transition hover:bg-brand-50/30',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
