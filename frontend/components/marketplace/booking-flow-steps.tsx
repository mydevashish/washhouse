import { cn } from '@/lib/utils';

const STEPS = [
  { step: 1, title: 'Choose laundry', desc: 'Compare ratings & distance' },
  { step: 2, title: 'Pick services', desc: 'Clear per-kg pricing' },
  { step: 3, title: 'Schedule pickup', desc: 'Free doorstep collection' },
  { step: 4, title: 'Track & receive', desc: 'Fresh clothes delivered' },
] as const;

type BookingFlowStepsProps = {
  current?: number;
  compact?: boolean;
  className?: string;
};

export function BookingFlowSteps({ current, compact, className }: BookingFlowStepsProps) {
  return (
    <ol
      className={cn(
        'grid gap-3',
        compact ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
      aria-label="How booking works"
    >
      {STEPS.map(({ step, title, desc }) => {
        const active = current === step;
        const done = current != null && current > step;
        return (
          <li
            key={step}
            className={cn(
              'rounded-2xl border p-4 transition-colors',
              active
                ? 'border-primary bg-primary/5 shadow-soft ring-1 ring-primary/20'
                : done
                  ? 'border-success/30 bg-success-muted/50'
                  : 'border-border bg-card',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                active && 'bg-primary text-primary-foreground',
                done && !active && 'bg-success text-success-foreground',
                !active && !done && 'bg-muted text-muted-foreground',
              )}
            >
              {step}
            </span>
            <p className="mt-3 font-semibold text-foreground">{title}</p>
            {!compact && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
          </li>
        );
      })}
    </ol>
  );
}
