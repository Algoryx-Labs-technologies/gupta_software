import { cn } from '@/lib/cn';

const ALGORYX_LOGO_SRC = '/algoryx-labs-logo.png';

interface DeveloperCreditProps {
  className?: string;
}

export function DeveloperCredit({ className }: DeveloperCreditProps) {
  return (
    <div className={cn('flex w-full flex-col items-center gap-2 text-center', className)}>
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
          className="h-10 w-auto object-contain sm:h-12"
        />
      </a>
      <p className="max-w-xs text-[10px] leading-snug text-muted sm:max-w-sm sm:text-xs">
        Software developed and managed by{' '}
        <span className="font-medium text-gray-600">Algoryx Labs and Technologies</span>
      </p>
    </div>
  );
}

export { ALGORYX_LOGO_SRC };
