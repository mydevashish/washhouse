import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OwnerMoneyStat } from '@/features/partner/components/owner/owner-money-stat';
import { OwnerSectionHeader } from '@/features/partner/components/owner/owner-section-header';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { PartnerAnalytics } from '@/services/partner';
import { cn } from '@/lib/utils';

function parseOptionalNumber(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function OwnerMoneyPulse({
  stats,
  loading,
  className,
}: {
  stats?: PartnerAnalytics;
  loading?: boolean;
  className?: string;
}) {
  const gross = stats ? Number(stats.revenue_today_inr) : null;
  const rate = parseOptionalNumber(stats?.effective_commission_rate);
  const net = parseOptionalNumber(stats?.partner_net_today_inr);
  const commission = parseOptionalNumber(stats?.commission_today_inr);
  const growth =
    parseOptionalNumber(stats?.growth_today_pct) ?? parseOptionalNumber(stats?.growth_week_pct);

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-xl bg-card p-4 ring-1 ring-border/60 sm:p-5',
        className,
      )}
      aria-label="Money today"
    >
      <OwnerSectionHeader
        title="Money today"
        description={
          rate != null
            ? `Platform cut ${rate.toFixed(0)}% · your net after commission`
            : 'Gross from delivered orders · open Money for the full split'
        }
        action={
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/partner/revenue">Open Money</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <OwnerMoneyStat
          label="Your net today"
          value={net != null && !Number.isNaN(net) ? formatInr(net) : '—'}
          caption={
            gross != null && !Number.isNaN(gross)
              ? `Gross ${formatInr(gross)}${commission != null ? ` · cut ${formatInr(commission)}` : ''}`
              : 'Delivered today'
          }
          loading={loading}
          emphasize
          deltaPct={growth}
        />

        <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Platform cut</p>
            {loading ? (
              <Skeleton className="mt-1 h-5 w-12" />
            ) : (
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {rate != null ? `${rate.toFixed(0)}%` : '—'}
              </p>
            )}
            <p className="mt-0.5 text-[10px] text-muted-foreground">Your effective rate</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Today&apos;s gross</p>
            {loading ? (
              <Skeleton className="mt-1 h-5 w-16" />
            ) : (
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {gross != null && !Number.isNaN(gross) ? formatInr(gross) : '—'}
              </p>
            )}
            <p className="mt-0.5 text-[10px] text-muted-foreground">Before platform share</p>
          </div>
        </div>
      </div>
    </section>
  );
}
