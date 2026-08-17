'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatInr } from '@/features/discover/detail/order-pricing';
import { usePartnerRevenueAnalytics } from '@/features/partner/hooks/use-partner-operations';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import { PARTNER_INPUT } from '@/features/partner/lib/partner-compact';
import {
  isValidCustomReportsRange,
  PARTNER_REVENUE_PERIOD_OPTIONS,
  resolvePartnerRevenueCustomRange,
  type PartnerRevenuePeriod,
} from '@/features/partner/lib/partner-revenue-period';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import type { PartnerAnalyticsPeriodScope } from '@/services/partner';

const PartnerRevenueChart = dynamic(
  () =>
    import('@/features/partner/components/partner-revenue-chart').then((m) => m.PartnerRevenueChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

function parseNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parsePct(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function periodLabel(period: PartnerRevenuePeriod): string {
  return PARTNER_REVENUE_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
}

function scopeValues(scope: PartnerAnalyticsPeriodScope | null | undefined) {
  if (!scope) {
    return {
      gross: 0,
      commission: 0,
      net: 0,
      growth: null as number | null,
      walkIn: 0,
      doorstep: 0,
      priorLabel: 'prior period',
      label: '',
    };
  }
  return {
    gross: parseNum(scope.revenue_gross_inr),
    commission: parseNum(scope.commission_inr),
    net: parseNum(scope.partner_net_inr),
    growth: parsePct(scope.growth_pct),
    walkIn: parseNum(scope.revenue_walk_in_inr),
    doorstep: parseNum(scope.revenue_doorstep_inr),
    priorLabel: scope.prior_period_label,
    label: scope.period_label_ist,
  };
}

export function PartnerRevenueView() {
  const [period, setPeriod] = useState<PartnerRevenuePeriod>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const customReady = period !== 'custom' || isValidCustomReportsRange(customFrom, customTo);
  const customRange = useMemo(() => {
    if (period !== 'custom' || !customReady) return undefined;
    const resolved = resolvePartnerRevenueCustomRange(customFrom, customTo);
    return { date_from: resolved.date_from, date_to: resolved.date_to };
  }, [period, customFrom, customTo, customReady]);

  const analyticsQ = usePartnerRevenueAnalytics(period, customRange);
  const stats = analyticsQ.data;
  const scope = stats?.period_scope;
  const values = scopeValues(scope);
  const rate = parseNum(stats?.effective_commission_rate ?? '10');

  const chartData = useMemo(() => {
    if (!scope?.chart_series?.length) return [];
    return scope.chart_series.map((point) => ({
      label: point.bucket_label,
      revenue: parseNum(point.revenue_gross_inr),
      net: parseNum(point.partner_net_inr),
    }));
  }, [scope]);

  const hasMoney = values.gross > 0;

  return (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader
        title="Money"
        description="Your net after the platform cut — from delivered orders."
        // actions={
        //   <Button type="button" size="sm" variant="outline" asChild>
        //     <Link href="/partner/settlements">Settlements</Link>
        //   </Button>
        // }
      />

      {analyticsQ.isError && (
        <QueryErrorState
          title="Could not load money"
          message={getApiErrorMessage(analyticsQ.error, 'Revenue analytics failed to load')}
          onRetry={() => void analyticsQ.refetch()}
          isRetrying={analyticsQ.isFetching}
        />
      )}

      <div className="space-y-2">
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-muted/50 p-1 ring-1 ring-border/50"
          role="tablist"
          aria-label="Money period"
          data-testid="partner-revenue-period-bar"
        >
          {PARTNER_REVENUE_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              data-testid={`partner-revenue-period-${option.value}`}
              aria-selected={period === option.value}
              className={cn(
                'inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition-colors',
                period === option.value
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {period === 'custom' ? (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="partner-revenue-from"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                From (IST)
              </label>
              <Input
                id="partner-revenue-from"
                type="date"
                className={cn(PARTNER_INPUT, 'w-[10.5rem] text-sm')}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                data-testid="partner-revenue-date-from"
              />
            </div>
            <div>
              <label
                htmlFor="partner-revenue-to"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                To (IST)
              </label>
              <Input
                id="partner-revenue-to"
                type="date"
                className={cn(PARTNER_INPUT, 'w-[10.5rem] text-sm')}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                data-testid="partner-revenue-date-to"
              />
            </div>
          </div>
        ) : null}

        {scope?.period_label_ist ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {scope.period_label_ist}
          </p>
        ) : null}
      </div>

      {!analyticsQ.isLoading && !analyticsQ.isError && customReady && !hasMoney ? (
        <OwnerEmptyState
          title="No delivered earnings yet"
          description="When orders are marked delivered in this range, gross, platform cut, and your net show up here."
          imageSrc={OWNER_IMAGES.money}
          imageAlt="Premium laundry"
          action={{ label: 'New Order', href: buildPartnerCreateOrderHref() }}
        />
      ) : !analyticsQ.isError && customReady ? (
        <section
          className="rounded-xl bg-card p-4 ring-1 ring-border/60 sm:p-4"
          aria-label={`${periodLabel(period)} money`}
          data-testid="partner-revenue-money-panel"
        >
          <OwnerSectionHeader
            title={`Your net · ${periodLabel(period).toLowerCase()}`}
            description={`Platform keeps ${rate.toFixed(0)}% of delivered order value (your rate). Settlements pay your net.`}
          />
          <div className="mt-4" data-testid="partner-revenue-net">
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
              <p
                className="mt-0.5 text-base font-semibold tabular-nums"
                data-testid="partner-revenue-gross"
              >
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

      {customReady ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PartnerPanel title="Gross & net snapshot" bodyClassName="p-4">
            {analyticsQ.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length ? (
              <PartnerRevenueChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground">No chart data for this range.</p>
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
              For {periodLabel(period).toLowerCase()}. Doorstep includes online and assisted orders.
            </p>
          </PartnerPanel>
        </div>
      ) : null}
    </PartnerContent>
  );
}
