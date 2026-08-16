'use client';

import { useCallback, useId, useRef, type KeyboardEvent } from 'react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  PARTNER_DASHBOARD_PERIOD_OPTIONS,
  usePartnerDashboardPeriod,
  type PartnerDashboardPeriod,
} from '@/features/partner/dashboard/partner-dashboard-period';
import {
  PartnerOpsKpiGrid,
  type PartnerOpsKpiItem,
} from '@/features/partner/components/ops-visual/partner-ops-kpi-grid';
import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import { usePartnerAnalyticsOverview } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

function parseInr(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatCount(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—';
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

function formatMoney(value: number | null, loading: boolean): string {
  if (loading) return '—';
  if (value == null || !Number.isFinite(value)) return '—';
  return formatInr(value);
}

function PartnerDashboardPeriodControl({
  period,
  onChange,
  periodLabelIst,
}: {
  period: PartnerDashboardPeriod;
  onChange: (period: PartnerDashboardPeriod) => void;
  periodLabelIst?: string;
}) {
  const liveId = useId();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const focusAt = useCallback((index: number) => {
    const root = toolbarRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>('[data-period-focusable="true"]');
    focusables[index]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      const focusables = Array.from(
        toolbarRef.current?.querySelectorAll<HTMLElement>('[data-period-focusable="true"]') ?? [],
      );
      if (focusables.length === 0) return;

      const current = focusables.indexOf(document.activeElement as HTMLElement);
      let next = current < 0 ? 0 : current;

      if (event.key === 'ArrowRight') next = (current + 1) % focusables.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + focusables.length) % focusables.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = focusables.length - 1;

      focusAt(next);
      const option = PARTNER_DASHBOARD_PERIOD_OPTIONS[next];
      if (option) onChange(option.value);
    },
    [focusAt, onChange],
  );

  return (
    <div className="space-y-2">
      <PartnerOpsSectionLabel id={liveId}>Quick overview</PartnerOpsSectionLabel>
      <div
        ref={toolbarRef}
        role="group"
        aria-labelledby={liveId}
        aria-label="Analytics period"
        className="flex w-full flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1 sm:inline-flex sm:w-auto"
        onKeyDown={onKeyDown}
      >
        {PARTNER_DASHBOARD_PERIOD_OPTIONS.map((option, index) => {
          const selected = period === option.value;
          return (
            <button
              key={option.value}
              type="button"
              data-period-focusable="true"
              data-testid={`partner-dashboard-period-${option.value}`}
              aria-pressed={selected}
              className={cn(
                'min-h-9 flex-1 rounded-full px-3 text-sm font-medium transition-colors sm:flex-none sm:px-4',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                onChange(option.value);
                focusAt(index);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {periodLabelIst ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {periodLabelIst}
        </p>
      ) : null}
    </div>
  );
}

export function PartnerQuickOverview({ className }: { className?: string }) {
  const mounted = useMounted();
  const { period, setPeriod } = usePartnerDashboardPeriod();
  const overviewQ = usePartnerAnalyticsOverview(period);

  const loading = !mounted || overviewQ.isLoading;
  const overview = mounted ? overviewQ.data : undefined;

  const grossInr = parseInr(overview?.revenue_gross_inr);
  const netInr = parseInr(overview?.revenue_net_inr);
  const pendingInr = parseInr(overview?.pending_payment_inr);

  const kpiItems: PartnerOpsKpiItem[] = [
    {
      label: 'Orders',
      value: formatCount(overview?.orders_count, loading),
    },
    {
      label: 'Pending work',
      value: formatCount(overview?.pending_orders_count, loading),
    },
    {
      label: 'Revenue (gross)',
      value: formatMoney(grossInr, loading),
      delta:
        netInr != null && !loading
          ? { label: `Net ${formatInr(netInr)}`, tone: 'muted' }
          : undefined,
    },
    {
      label: 'Pending payment',
      value: formatCount(overview?.pending_payment_count, loading),
      delta:
        pendingInr != null && pendingInr > 0 && !loading
          ? { label: formatInr(pendingInr), tone: 'warning' }
          : undefined,
    },
    {
      label: 'Customers',
      value: formatCount(overview?.customers_count_period, loading),
      delta:
        overview?.customers_count_all_time != null && !loading
          ? {
              label: `${overview.customers_count_all_time} all time`,
              tone: 'muted',
            }
          : undefined,
    },
  ];

  if (overviewQ.isError) {
    return (
      <PartnerOpsSurface className={className} aria-label="Quick overview">
        <PartnerDashboardPeriodControl
          period={period}
          onChange={setPeriod}
          periodLabelIst={overview?.period_label_ist}
        />
        <div className="mt-4">
          <QueryErrorState
            title="Could not load overview"
            message={getApiErrorMessage(overviewQ.error, 'Period metrics failed to load')}
            onRetry={() => void overviewQ.refetch()}
            isRetrying={overviewQ.isFetching}
          />
        </div>
      </PartnerOpsSurface>
    );
  }

  return (
    <PartnerOpsSurface as="section" className={className} aria-label="Quick overview">
      <PartnerDashboardPeriodControl
        period={period}
        onChange={setPeriod}
        periodLabelIst={overview?.period_label_ist}
      />
      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
      ) : (
        <PartnerOpsKpiGrid items={kpiItems} className="mt-4 sm:grid-cols-2 lg:grid-cols-3" />
      )}
    </PartnerOpsSurface>
  );
}
