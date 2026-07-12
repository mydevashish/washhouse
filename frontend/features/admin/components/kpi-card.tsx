'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { KpiSparkline } from '@/features/admin/components/kpi-sparkline';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type KpiStatus = 'healthy' | 'warning' | 'critical' | 'neutral';

type KpiCardProps = {
  label: string;
  value: string;
  change?: { value: string; positive?: boolean };
  sparkline?: number[];
  status?: KpiStatus;
  icon: LucideIcon;
  loading?: boolean;
  onClick?: () => void;
};

const STATUS_DOT: Record<KpiStatus, string> = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-destructive',
  neutral: 'bg-muted-foreground/40',
};

export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  change,
  sparkline,
  status = 'neutral',
  icon: Icon,
  loading,
  onClick,
}: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[status])} aria-hidden />
          <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        </div>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          )}
          {!loading && change && (
            <p
              className={cn(
                'mt-0.5 line-clamp-1 text-[11px] font-medium',
                change.positive !== false ? 'text-success' : 'text-destructive',
              )}
            >
              {change.positive !== false ? (
                <TrendingUp className="mr-0.5 inline h-3 w-3" aria-hidden />
              ) : (
                <TrendingDown className="mr-0.5 inline h-3 w-3" aria-hidden />
              )}
              {change.value}
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && !loading && (
          <KpiSparkline
            data={sparkline}
            positive={change?.positive !== false}
            className="h-8 w-16 shrink-0 opacity-75"
          />
        )}
      </div>
    </>
  );

  const className = cn(
    'rounded-xl bg-card p-3 text-left ring-1 ring-border/50 transition-colors',
    onClick && 'cursor-pointer hover:bg-muted/30 hover:ring-border',
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(className, 'w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
      >
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
