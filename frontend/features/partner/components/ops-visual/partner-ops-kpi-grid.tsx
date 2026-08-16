import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import { PARTNER_CARD } from '@/features/partner/lib/partner-compact';
import { cn } from '@/lib/utils';
export type PartnerOpsKpiDelta = {
  label: string;
  tone?: 'success' | 'warning' | 'muted';
};

export type PartnerOpsKpiItem = {
  label: string;
  value: string;
  delta?: PartnerOpsKpiDelta;
  href?: string;
};

const deltaToneClass: Record<NonNullable<PartnerOpsKpiDelta['tone']>, string> = {
  success: 'text-success',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
};

function PartnerOpsKpiTile({ item, loading }: { item: PartnerOpsKpiItem; loading?: boolean }) {
  const body = (
    <>
      <PartnerOpsSectionLabel as="span">{item.label}</PartnerOpsSectionLabel>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="mt-3 text-lg font-semibold tabular-nums tracking-tight text-foreground">{item.value}</p>
      )}
      {item.delta && !loading ? (
        <p className={cn('mt-1 text-xs font-medium', deltaToneClass[item.delta.tone ?? 'muted'])}>
          {item.delta.label}
        </p>
      ) : null}
    </>
  );

  const tileClass = cn(
    'rounded-xl bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-muted/40',
    'p-3 sm:p-4',
  );
  if (item.href && !loading) {
    return (
      <Link href={item.href} className={cn(tileClass, 'hover:bg-muted/80')}>
        {body}
      </Link>
    );
  }

  return <div className={tileClass}>{body}</div>;
}

export function PartnerOpsKpiGrid({
  items,
  loading,
  error,
  onRetry,
  retryLabel = 'Try again',
  className,
}: {
  items: PartnerOpsKpiItem[];
  loading?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  if (error) {
    return (
      <div
        className={cn(PARTNER_CARD, 'bg-muted/40 text-sm text-muted-foreground', className)}
        role="alert"
      >        <div>{error}</div>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => (
        <PartnerOpsKpiTile key={item.label} item={item} loading={loading} />
      ))}
    </div>
  );
}
