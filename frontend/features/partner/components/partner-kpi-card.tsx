import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PartnerKpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6', className)}>{children}</div>
  );
}

export function PartnerKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
  accent?: 'default' | 'warning' | 'success';
}) {
  const accentRing =
    accent === 'warning'
      ? 'ring-warning/40'
      : accent === 'success'
        ? 'ring-success/40'
        : 'ring-border/60';

  return (
    <div className={cn('rounded-lg bg-card p-2.5 ring-1', accentRing)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && !loading && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}
