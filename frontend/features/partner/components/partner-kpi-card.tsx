import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PartnerKpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
  );
}

export function PartnerKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
  accent?: 'default' | 'warning' | 'success';
  href?: string;
}) {
  const accentRing =
    accent === 'warning'
      ? 'ring-warning/40'
      : accent === 'success'
        ? 'ring-success/40'
        : 'ring-border/60';

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            accent === 'warning'
              ? 'bg-warning-muted text-warning'
              : accent === 'success'
                ? 'bg-success-muted text-success'
                : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && !loading && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'block rounded-lg bg-card p-2.5 ring-1 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          accentRing,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn('rounded-lg bg-card p-2.5 ring-1', accentRing)}>{body}</div>;
}
