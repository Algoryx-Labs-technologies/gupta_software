import { cn } from '@/lib/cn';

const LOGO_SRC = '/gupta-traders-logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-20',
  xl: 'h-28',
};

export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Gupta Traders"
      className={cn('w-auto object-contain', sizes[size], className)}
    />
  );
}

export { LOGO_SRC };
