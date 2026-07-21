import { cn } from '@/lib/cn';

const ALGORYX_LOGO_SRC = '/algoryx-labs-logo.png';

interface DeveloperCreditProps {
  className?: string;
  compact?: boolean;
}

export function DeveloperCredit({ className, compact = false }: DeveloperCreditProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-1.5 text-center',
        compact ? 'items-center' : 'items-center gap-2',
        className,
      )}
    >
      <a
        href="https://www.algoryx.io"
        target="_blank"
        rel="noopener noreferrer"
        title="www.algoryx.io"
        className="transition-opacity hover:opacity-80"
      >
        <img
          src={ALGORYX_LOGO_SRC}
          alt="Algoryx Labs and Technologies — www.algoryx.io"
          className={cn(
            'w-auto object-contain',
            compact ? 'h-8' : 'h-10 sm:h-12',
          )}
        />
      </a>
      <p
        className={cn(
          'leading-snug text-muted',
          compact ? 'text-[9px] leading-tight' : 'max-w-xs text-[10px] sm:max-w-sm sm:text-xs',
        )}
      >
        Software developed and managed by{' '}
        <span className="font-medium text-gray-600">Algoryx Labs and Technologies</span>
      </p>
    </div>
  );
}

export { ALGORYX_LOGO_SRC };
