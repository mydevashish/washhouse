'use client';

import { Badge } from '@/components/ui/badge';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { CustomerDeskProfile } from '@/features/partner/customer-desk/types';
import { PARTNER_CARD } from '@/features/partner/lib/partner-compact';
import { cn } from '@/lib/utils';

export type PartnerCustomerSnapshotStats = {
  lifetime_spend_inr?: string | null;
  segment_label?: string | null;
};

function formatLastOrder(iso: string | null): string {
  if (!iso) return 'No orders yet';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatTotalSpent(
  profile: CustomerDeskProfile,
  stats?: PartnerCustomerSnapshotStats | null,
): string {
  const spent = stats?.lifetime_spend_inr;
  const spentNum = spent != null && spent !== '' ? Number(spent) : null;

  if (spentNum != null && !Number.isNaN(spentNum)) {
    return formatInr(spentNum);
  }
  if (profile.phone?.trim()) {
    return formatInr(0);
  }
  return '—';
}

export function PartnerCustomerSnapshotCards({
  profile,
  stats,
  className,
}: {
  profile: CustomerDeskProfile;
  stats?: PartnerCustomerSnapshotStats | null;
  className?: string;
}) {
  const segment = stats?.segment_label?.trim();

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div className={cn(PARTNER_CARD, 'bg-background')}>
        <p className="text-sm font-semibold">{profile.name?.trim() || 'Customer'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {profile.registered ? (
            <Badge variant="secondary" className="text-[10px]">
              Registered
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              Guest
            </Badge>
          )}
          {segment ? (
            <Badge variant="outline" className="text-[10px]">
              {segment}
            </Badge>
          ) : null}
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="font-mono text-muted-foreground">{profile.phone}</p>
          {profile.email ? <p className="text-muted-foreground">{profile.email}</p> : null}
          <p className="text-xs text-muted-foreground">
            Last order · {formatLastOrder(profile.last_order_at)}
          </p>
        </div>
      </div>
      <div className={cn(PARTNER_CARD, 'bg-background')}>
        <p className="text-sm font-semibold">Customer value</p>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Total orders</dt>
            <dd className="font-medium tabular-nums">{profile.order_count}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Total spent</dt>
            <dd className="font-medium tabular-nums" data-testid="partner-customer-total-spent">
              {formatTotalSpent(profile, stats)}
            </dd>
          </div>
          {segment ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Segment</dt>
              <dd className="font-medium">{segment}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
