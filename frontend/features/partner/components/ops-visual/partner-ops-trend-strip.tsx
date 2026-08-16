import Link from 'next/link';

import { cn } from '@/lib/utils';

export type PartnerOpsTrendPoint = {
  label: string;
  value: number;
};

export function PartnerOpsTrendStrip({
  title = 'Sales trend',
  data,
  emptyMessage = 'Weekly chart coming soon — view revenue for totals.',
  emptyHref,
  className,
}: {
  title?: string;
  data: PartnerOpsTrendPoint[];
  emptyMessage?: string;
  emptyHref?: string;
  className?: string;
}) {
  const maxValue = Math.max(1, ...data.map((point) => point.value));
  const allZero = data.length === 0 || data.every((point) => point.value <= 0);

  return (
    <div className={cn('rounded-xl bg-muted/40 p-4', className)}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {allZero ? (
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>{emptyMessage}</p>
          {emptyHref ? (
            <Link href={emptyHref} className="font-medium text-primary underline-offset-4 hover:underline">
              Open revenue
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid gap-2" role="img" aria-label={`${title} by day`}>
          {data.map((point) => {
            const width = Math.min(100, (point.value / maxValue) * 100);
            return (
              <div key={point.label} className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 text-muted-foreground">{point.label}</span>
                <div className="flex h-3 min-w-0 flex-1 items-center gap-2">
                  <div className="h-3 min-w-0 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary motion-safe:transition-[width]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                    {point.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
