import { TrendingDown, TrendingUp } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function OwnerMoneyStat({
  label,
  value,
  caption,
  deltaPct,
  loading,
  className,
  emphasize,
}: {
  label: string;
  value: string;
  caption?: string;
  /** Signed percent growth; null/undefined hides the chip. */
  deltaPct?: number | null;
  loading?: boolean;
  className?: string;
  /** Larger net / hero amount. */
  emphasize?: boolean;
}) {
  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const up = hasDelta && deltaPct > 0;
  const down = hasDelta && deltaPct < 0;

  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className={cn('mt-1', emphasize ? 'h-8 w-28' : 'h-6 w-20')} />
      ) : (
        <p
          className={cn(
            'mt-0.5 font-semibold tabular-nums tracking-tight text-foreground',
            emphasize ? 'text-lg font-semibold tabular-nums' : 'text-lg',
          )}
        >
          {value}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {hasDelta && !loading ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
              up && 'bg-success-muted text-success',
              down && 'bg-danger/10 text-danger',
              !up && !down && 'bg-muted text-muted-foreground',
            )}
            aria-label={
              up
                ? `Up ${Math.abs(deltaPct).toFixed(0)} percent`
                : down
                  ? `Down ${Math.abs(deltaPct).toFixed(0)} percent`
                  : 'No change'
            }
          >
            {up ? <TrendingUp className="h-3 w-3" aria-hidden /> : null}
            {down ? <TrendingDown className="h-3 w-3" aria-hidden /> : null}
            {deltaPct > 0 ? '+' : ''}
            {deltaPct.toFixed(0)}%
          </span>
        ) : null}
        {caption && !loading ? (
          <p className="text-[11px] text-muted-foreground">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
