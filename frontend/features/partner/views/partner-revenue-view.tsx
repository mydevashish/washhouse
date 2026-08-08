'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import {
  OWNER_IMAGES,
  OwnerEmptyState,
  OwnerMoneyStat,
  OwnerSectionHeader,
} from '@/features/partner/components/owner';
import { usePartnerAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import type { PartnerAnalytics } from '@/services/partner';

const PartnerRevenueChart = dynamic(
  () =>
    import('@/features/partner/components/partner-revenue-chart').then((m) => m.PartnerRevenueChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

type MoneyPeriod = 'today' | 'week' | 'month';

const PERIOD_LABEL: Record<MoneyPeriod, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
};

function parseNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parsePct(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function periodValues(stats: PartnerAnalytics | undefined, period: MoneyPeriod) {
  if (!stats) {
    return {
      gross: 0,
      commission: 0,
      net: 0,
      growth: null as number | null,
      walkIn: 0,
      doorstep: 0,
      priorLabel: 'prior period',
    };
  }
  if (period === 'today') {
    return {
      gross: parseNum(stats.revenue_today_inr),
      commission: parseNum(stats.commission_today_inr),
      net: parseNum(stats.partner_net_today_inr),
      growth: parsePct(stats.growth_today_pct),
      walkIn: parseNum(stats.revenue_walk_in_today_inr),
      doorstep: parseNum(stats.revenue_doorstep_today_inr),
      priorLabel: 'yesterday',
    };
  }
  if (period === 'week') {
    return {
      gross: parseNum(stats.revenue_week_inr),
      commission: parseNum(stats.commission_week_inr),
      net: parseNum(stats.partner_net_week_inr),
      growth: parsePct(stats.growth_week_pct),
      walkIn: parseNum(stats.revenue_walk_in_week_inr),
      doorstep: parseNum(stats.revenue_doorstep_week_inr),
      priorLabel: 'last week',
    };
  }
  return {
    gross: parseNum(stats.revenue_this_month_inr),
    commission: parseNum(stats.commission_month_inr),
    net: parseNum(stats.partner_net_month_inr),
    growth: parsePct(stats.growth_month_pct),
    walkIn: parseNum(stats.revenue_walk_in_month_inr),
    doorstep: parseNum(stats.revenue_doorstep_month_inr),
    priorLabel: 'last month',
  };
}

export function PartnerRevenueView() {
  const analyticsQ = usePartnerAnalytics();
  const stats = analyticsQ.data;
  const [period, setPeriod] = useState<MoneyPeriod>('today');

  const values = periodValues(stats, period);
  const rate = parseNum(stats?.effective_commission_rate ?? '10');

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Yesterday', revenue: parseNum(stats.revenue_yesterday_inr), net: 0 },
      {
        label: 'Today',
        revenue: parseNum(stats.revenue_today_inr),
        net: parseNum(stats.partner_net_today_inr),
      },
      {
        label: 'This week',
        revenue: parseNum(stats.revenue_week_inr),
        net: parseNum(stats.partner_net_week_inr),
      },
      {
        label: 'This month',
        revenue: parseNum(stats.revenue_this_month_inr),
        net: parseNum(stats.partner_net_month_inr),
      },
    ];
  }, [stats]);

  const hasMoney = values.gross > 0 || parseNum(stats?.revenue_inr) > 0;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Money"
        description="Your net after the platform cut — from delivered orders."
        actions={
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/partner/settlements">Settlements</Link>
          </Button>
        }
      />

      {analyticsQ.isError && (
        <QueryErrorState
          title="Could not load money"
          message={getApiErrorMessage(analyticsQ.error, 'Revenue analytics failed to load')}
          onRetry={() => void analyticsQ.refetch()}
          isRetrying={analyticsQ.isFetching}
        />
      )}

      <div
        className="flex flex-wrap gap-1.5 rounded-xl bg-muted/50 p-1 ring-1 ring-border/50"
        role="tablist"
        aria-label="Money period"
      >
        {(Object.keys(PERIOD_LABEL) as MoneyPeriod[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={period === key}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              period === key
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setPeriod(key)}
          >
            {PERIOD_LABEL[key]}
          </button>
        ))}
      </div>

      {!analyticsQ.isLoading && !analyticsQ.isError && !hasMoney ? (
        <OwnerEmptyState
          title="No delivered earnings yet"
          description="When orders are marked delivered, gross, platform cut, and your net show up here."
          imageSrc={OWNER_IMAGES.money}
          imageAlt="Premium laundry"
          action={{ label: 'New Order', href: '/partner/new-order' }}
        />
      ) : !analyticsQ.isError ? (
        <section
          className="rounded-xl bg-card p-4 ring-1 ring-border/60 sm:p-6"
          aria-label={`${PERIOD_LABEL[period]} money`}
        >
          <OwnerSectionHeader
            title={`Your net · ${PERIOD_LABEL[period].toLowerCase()}`}
            description={`Platform keeps ${rate.toFixed(0)}% of delivered order value (your rate). Settlements pay your net.`}
          />
          <div className="mt-4">
            <OwnerMoneyStat
              label="Your net"
              value={analyticsQ.isLoading ? '—' : formatInr(values.net)}
              caption={
                values.growth == null
                  ? `vs ${values.priorLabel} · new or no prior`
                  : `vs ${values.priorLabel}`
              }
              deltaPct={values.growth}
              loading={analyticsQ.isLoading}
              emphasize
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Gross</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">
                {analyticsQ.isLoading ? '—' : formatInr(values.gross)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Platform cut</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">
                {analyticsQ.isLoading ? '—' : `${rate.toFixed(0)}%`}
              </p>
              <p className="text-[10px] text-muted-foreground">Effective rate</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Commission ₹</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">
                {analyticsQ.isLoading ? '—' : formatInr(values.commission)}
              </p>
              <p className="text-[10px] text-muted-foreground">From order snapshots</p>
            </div>
          </div>
        </section>
      ) : null}

      <PartnerPanel title="How commission works" bodyClassName="space-y-3 p-4 text-sm">
        <p className="text-muted-foreground">
          Platform keeps about <span className="font-semibold text-foreground">{rate.toFixed(0)}%</span> of
          each delivered order&apos;s value. Your rate right now:{' '}
          <span className="font-semibold text-foreground">{rate.toFixed(0)}%</span>. Commission ₹ uses the
          rate snapshotted on each order, so older orders stay honest if your rate changes later.
        </p>
        <p className="text-muted-foreground">
          Settlements release your <span className="font-semibold text-foreground">net</span> (gross −
          commission) on the payout schedule.
        </p>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link href="/partner/settlements">View settlements</Link>
        </Button>
      </PartnerPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartnerPanel title="Gross & net snapshot" bodyClassName="p-4">
          {analyticsQ.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <PartnerRevenueChart data={chartData} />
          )}
        </PartnerPanel>

        <PartnerPanel title="Walk-in vs doorstep" bodyClassName="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Walk-in gross</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {analyticsQ.isLoading ? '—' : formatInr(values.walkIn)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Doorstep gross</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {analyticsQ.isLoading ? '—' : formatInr(values.doorstep)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            For {PERIOD_LABEL[period].toLowerCase()}. Doorstep includes online and assisted orders.
          </p>
        </PartnerPanel>
      </div>
    </PartnerContent>
  );
}
