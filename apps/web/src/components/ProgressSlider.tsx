import { cn } from '@/lib/cn';

interface ProgressSliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
}

export function ProgressSlider({
  label = 'Progress',
  value,
  onChange,
  error,
  className,
}: ProgressSliderProps) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <span className="text-sm font-semibold text-brand-700">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-100 accent-brand-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-500"
        aria-label={label}
      />
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-gradient transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>0%</span>
        <span>100%</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
