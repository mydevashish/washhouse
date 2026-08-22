'use client';

import { Badge } from '@/components/ui/badge';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { CustomerDeskProfile } from '@/features/partner/customer-desk/types';
import { PARTNER_CARD } from '@/features/partner/lib/partner-compact';
import { cn } from '@/lib/utils';

export type PartnerCustomerSnapshotStats = {
  lifetime_spend_inr?: string | null;
  segment_label?: string | null;
  plan_name?: string | null;
  plan_amount_inr?: string | null;
  wallet_used_inr?: string | null;
  wallet_remaining_inr?: string | null;
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

function parseMoneyValue(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/[₹,\s]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTotalSpent(
  profile: CustomerDeskProfile,
  stats?: PartnerCustomerSnapshotStats | null,
): string {
  const spent = stats?.lifetime_spend_inr;
  const spentNum = parseMoneyValue(spent);

  if (spentNum != null && !Number.isNaN(spentNum)) {
    return formatInr(spentNum);
  }
  if (profile.phone?.trim()) {
    return formatInr(0);
  }
  return '—';
}

function PlanWalletMeta({ stats }: { stats?: PartnerCustomerSnapshotStats | null }) {
  const planName = stats?.plan_name?.trim();
  const walletUsed = stats?.wallet_used_inr;
  const walletRemaining = stats?.wallet_remaining_inr;
  const planAmount = stats?.plan_amount_inr;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Plan / Wallet</span>
        <span className="font-medium text-right">{planName || '—'}</span>
      </div>
      <div className="grid gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span>Used</span>
          <span className="font-medium text-foreground tabular-nums">
            {walletUsed ? formatInr(Number(walletUsed)) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Remaining</span>
          <span className="font-medium text-foreground tabular-nums">
            {walletRemaining ? formatInr(Number(walletRemaining)) : '—'}
          </span>
        </div>
        {planAmount ? (
          <div className="flex items-center justify-between gap-2">
            <span>Wallet</span>
            <span className="font-medium text-foreground tabular-nums">
              {formatInr(Number(planAmount))}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PartnerCustomerIdentitySummary({
  name,
  phone,
  stats,
  className,
}: {
  name?: string | null;
  phone?: string | null;
  stats?: PartnerCustomerSnapshotStats | null;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-[1fr_1.1fr]', className)}>
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        <p className="font-semibold">{name?.trim() || 'Customer'}</p>
        <p className="text-muted-foreground">{phone || '—'}</p>
      </div>

      <div className={cn(PARTNER_CARD, 'bg-background p-3')}>
        <PlanWalletMeta stats={stats} />
      </div>
    </div>
  );
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
  const planName = stats?.plan_name?.trim();
  const planAmount = stats?.plan_amount_inr;
  const walletUsed = stats?.wallet_used_inr;
  const walletRemaining = stats?.wallet_remaining_inr;

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

          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Segment</dt>
            <dd className="font-medium">{segment || 'No Plan is Active'}</dd>
          </div>

          <div className="border-t border-border pt-2">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Plan / Wallet</dt>
              <dd className="font-medium text-right">{planName || '—'}</dd>
            </div>
            <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <span>Used</span>
                <span className="font-medium text-foreground tabular-nums">
                  {walletUsed ? formatInr(parseMoneyValue(walletUsed) ?? 0) : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Remaining</span>
                <span className="font-medium text-foreground tabular-nums">
                  {walletRemaining ? formatInr(parseMoneyValue(walletRemaining) ?? 0) : '—'}
                </span>
              </div>
              {planAmount ? (
                <div className="flex justify-between gap-2">
                  <span>Wallet</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatInr(parseMoneyValue(planAmount) ?? 0)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
