import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type PartnerOpsStatusColorToken =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'muted';

export type PartnerOpsStatusBarRow = {
  label: string;
  value: number;
  /** Bar scale denominator; defaults to max row value (min 1). */
  max?: number;
  colorToken: PartnerOpsStatusColorToken;
};

const barFillClass: Record<PartnerOpsStatusColorToken, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  muted: 'bg-muted-foreground',
};

function barWidthPercent(value: number, scaleMax: number) {
  if (scaleMax <= 0) return 0;
  return Math.min(100, Math.max(0, (value / scaleMax) * 100));
}

export function PartnerOpsStatusBars({
  rows,
  loading,
  className,
  'aria-label': ariaLabel = 'Order status overview',
}: {
  rows: PartnerOpsStatusBarRow[];
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  const globalMax = Math.max(1, ...rows.map((row) => row.value));

  if (loading) {
    return (
      <div className={cn('grid gap-3', className)} aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3', className)} role="group" aria-label={ariaLabel}>
      {rows.map((row) => {
        const denominator = row.max ?? globalMax;
        const width = barWidthPercent(row.value, denominator);
        return (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted" role="meter"
              aria-valuemin={0}
              aria-valuemax={denominator}
              aria-valuenow={row.value}
              aria-label={`${row.label}: ${row.value}`}
            >
              <div
                className={cn('h-full rounded-full motion-safe:transition-[width]', barFillClass[row.colorToken])}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
