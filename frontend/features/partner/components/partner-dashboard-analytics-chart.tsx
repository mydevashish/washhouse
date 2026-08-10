'use client';

import Link from 'next/link';
import { useId, useMemo, type KeyboardEvent } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { usePartnerDashboardPeriod } from '@/features/partner/dashboard/partner-dashboard-period';
import {
  PARTNER_DASHBOARD_CHART_TYPE_OPTIONS,
  usePartnerDashboardChartType,
  type PartnerDashboardChartType,
} from '@/features/partner/dashboard/partner-dashboard-chart-type';
import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import { usePartnerAnalyticsOverview } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';
import type {
  PartnerAnalyticsOverview,
  PartnerAnalyticsOverviewChartPoint,
} from '@/services/partner';

/** SVG-safe hex colors — Recharts cannot resolve `hsl(var(--token))`. */
const METRIC_COLORS = {
  orders: '#1578b5',
  pendingWork: '#d97706',
  pendingPayment: '#9333ea',
  customers: '#047857',
  revenue: '#0891b2',
  pendingInr: '#dc2626',
} as const;

const METRIC_COLOR_BY_LABEL: Record<string, string> = {
  Orders: METRIC_COLORS.orders,
  'Pending work': METRIC_COLORS.pendingWork,
  'Pending payment': METRIC_COLORS.pendingPayment,
  Customers: METRIC_COLORS.customers,
  Revenue: METRIC_COLORS.revenue,
  'Pending ₹': METRIC_COLORS.pendingInr,
};

const METRIC_LEGEND_ITEMS: { label: string; color: string; hint: string }[] = [
  { label: 'Orders', color: METRIC_COLORS.orders, hint: 'count' },
  { label: 'Pending work', color: METRIC_COLORS.pendingWork, hint: 'count' },
  { label: 'Pending payment', color: METRIC_COLORS.pendingPayment, hint: 'count' },
  { label: 'Customers', color: METRIC_COLORS.customers, hint: 'count' },
  { label: 'Revenue', color: METRIC_COLORS.revenue, hint: '₹' },
  { label: 'Pending ₹', color: METRIC_COLORS.pendingInr, hint: '₹' },
];

function hexFill(color: string, alphaHex = '2e'): string {
  return `${color}${alphaHex}`;
}

type SeriesRow = {
  label: string;
  orders: number;
  pendingOrders: number;
  customers: number;
  pendingPaymentCount: number;
  revenue: number;
  pendingPaymentInr: number;
};

type OverviewPieRow = {
  name: string;
  value: number;
  isInr: boolean;
};

const COUNT_METRICS: { key: keyof SeriesRow; label: string; stroke: string }[] = [
  { key: 'orders', label: 'Orders', stroke: METRIC_COLORS.orders },
  { key: 'pendingOrders', label: 'Pending work', stroke: METRIC_COLORS.pendingWork },
  { key: 'pendingPaymentCount', label: 'Pending payment', stroke: METRIC_COLORS.pendingPayment },
  { key: 'customers', label: 'Customers', stroke: METRIC_COLORS.customers },
];

const INR_METRICS: { key: keyof SeriesRow; label: string; stroke: string }[] = [
  { key: 'revenue', label: 'Revenue', stroke: METRIC_COLORS.revenue },
  { key: 'pendingPaymentInr', label: 'Pending ₹', stroke: METRIC_COLORS.pendingInr },
];

function parseInr(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapChartSeries(points: PartnerAnalyticsOverviewChartPoint[] | undefined): SeriesRow[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    label: p.bucket_label,
    orders: p.orders_count ?? 0,
    pendingOrders: p.pending_orders_count ?? 0,
    customers: p.customers_count ?? 0,
    pendingPaymentCount: p.pending_payment_count ?? 0,
    revenue: parseInr(p.revenue_gross_inr),
    pendingPaymentInr: parseInr(p.pending_payment_inr),
  }));
}

function buildOverviewPieRows(overview: PartnerAnalyticsOverview): OverviewPieRow[] {
  const rows: OverviewPieRow[] = [
    { name: 'Orders', value: overview.orders_count, isInr: false },
    { name: 'Pending work', value: overview.pending_orders_count, isInr: false },
    { name: 'Pending payment', value: overview.pending_payment_count, isInr: false },
    { name: 'Customers', value: overview.customers_count_period, isInr: false },
  ];
  return rows.filter((r) => r.value > 0);
}

function periodHasActivity(overview: PartnerAnalyticsOverview | undefined, rows: SeriesRow[]): boolean {
  if (!overview) return false;
  if (overview.orders_count > 0) return true;
  if (overview.pending_orders_count > 0) return true;
  if (overview.pending_payment_count > 0) return true;
  if (overview.customers_count_period > 0) return true;
  if (parseInr(overview.revenue_gross_inr) > 0) return true;
  if (parseInr(overview.pending_payment_inr) > 0) return true;
  return rows.some(
    (r) =>
      r.orders > 0 ||
      r.pendingOrders > 0 ||
      r.customers > 0 ||
      r.pendingPaymentCount > 0 ||
      r.revenue > 0 ||
      r.pendingPaymentInr > 0,
  );
}

function buildAccessibleSummary(overview: PartnerAnalyticsOverview | undefined, periodLabel?: string): string {
  const window = periodLabel ? ` for ${periodLabel}` : '';
  if (!overview) return `Analytics chart${window}.`;
  return (
    `Analytics chart${window}: ${overview.orders_count} orders, ` +
    `${overview.pending_orders_count} pending work, ` +
    `${formatInr(parseInr(overview.revenue_gross_inr))} revenue, ` +
    `${overview.pending_payment_count} pending payment (${formatInr(parseInr(overview.pending_payment_inr))}), ` +
    `${overview.customers_count_period} customers.`
  );
}

function ChartTypeToggle({
  chartType,
  onChange,
}: {
  chartType: PartnerDashboardChartType;
  onChange: (type: PartnerDashboardChartType) => void;
}) {
  const labelId = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const options = PARTNER_DASHBOARD_CHART_TYPE_OPTIONS;
    const index = options.findIndex((o) => o.value === chartType);
    let next = index < 0 ? 0 : index;
    if (event.key === 'ArrowRight') next = (index + 1) % options.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    const option = options[next];
    if (option) onChange(option.value);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-label="Chart type"
      className="flex w-full flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1 sm:inline-flex sm:w-auto"
      onKeyDown={onKeyDown}
    >
      <span id={labelId} className="sr-only">
        Chart type
      </span>
      {PARTNER_DASHBOARD_CHART_TYPE_OPTIONS.map((option) => {
        const selected = chartType === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={cn(
              'min-h-9 flex-1 rounded-full px-3 text-sm font-medium transition-colors sm:flex-none sm:px-3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function formatTooltipValue(value: unknown, name: string | undefined, isInrKey: boolean): [string, string] {
  const label = name ?? '';
  if (isInrKey) return [formatInr(Number(value)), label];
  return [String(value ?? 0), label];
}

function MetricColorLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground" aria-label="Chart metric colors">
      {METRIC_LEGEND_ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/60"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span>
            {item.label}
            <span className="text-[10px] text-muted-foreground/80"> ({item.hint})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function OverviewPieChart({ rows, animate }: { rows: OverviewPieRow[]; animate: boolean }) {
  if (rows.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          formatter={(value, _name, item) => {
            const payload = item.payload as OverviewPieRow;
            return payload.isInr ? formatInr(Number(value)) : String(value);
          }}
        />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="78%"
          isAnimationActive={animate}
        >
          {rows.map((entry) => (
            <Cell
              key={entry.name}
              fill={METRIC_COLOR_BY_LABEL[entry.name] ?? METRIC_COLORS.orders}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function MultiMetricTimeChart({
  chartType,
  rows,
  animate,
}: {
  chartType: Exclude<PartnerDashboardChartType, 'pie'>;
  rows: SeriesRow[];
  animate: boolean;
}) {
  const cartesianRows = rows.length > 0 ? rows : [{ label: '—', orders: 0, pendingOrders: 0, customers: 0, pendingPaymentCount: 0, revenue: 0, pendingPaymentInr: 0 }];
  const margin = { top: 8, right: 4, left: -8, bottom: 0 };

  const renderCountSeries = () =>
    COUNT_METRICS.map((metric) => {
      if (chartType === 'bar') {
        return (
          <Bar
            key={metric.key}
            yAxisId="count"
            dataKey={metric.key}
            name={metric.label}
            fill={metric.stroke}
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
            isAnimationActive={animate}
          />
        );
      }
      if (chartType === 'area') {
        return (
          <Area
            key={metric.key}
            yAxisId="count"
            type="monotone"
            dataKey={metric.key}
            name={metric.label}
            stroke={metric.stroke}
            fill={hexFill(metric.stroke)}
            strokeWidth={1.5}
            isAnimationActive={animate}
          />
        );
      }
      return (
        <Line
          key={metric.key}
          yAxisId="count"
          type="monotone"
          dataKey={metric.key}
          name={metric.label}
          stroke={metric.stroke}
          strokeWidth={2}
          dot={false}
          isAnimationActive={animate}
        />
      );
    });

  const renderInrSeries = () =>
    INR_METRICS.map((metric) => {
      if (chartType === 'bar') {
        return (
          <Bar
            key={metric.key}
            yAxisId="inr"
            dataKey={metric.key}
            name={metric.label}
            fill={metric.stroke}
            radius={[2, 2, 0, 0]}
            maxBarSize={12}
            isAnimationActive={animate}
          />
        );
      }
      if (chartType === 'area') {
        return (
          <Area
            key={metric.key}
            yAxisId="inr"
            type="monotone"
            dataKey={metric.key}
            name={metric.label}
            stroke={metric.stroke}
            fill={hexFill(metric.stroke, '24')}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            isAnimationActive={animate}
          />
        );
      }
      return (
        <Line
          key={metric.key}
          yAxisId="inr"
          type="monotone"
          dataKey={metric.key}
          name={metric.label}
          stroke={metric.stroke}
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          isAnimationActive={animate}
        />
      );
    });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={cartesianRows} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="count"
          allowDecimals={false}
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <YAxis
          yAxisId="inr"
          orientation="right"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => (Number(v) >= 1000 ? `₹${Math.round(Number(v) / 1000)}k` : `₹${v}`)}
        />
        <Tooltip
          formatter={(value, name) => {
            const inr = INR_METRICS.some((m) => m.label === name);
            return formatTooltipValue(value, String(name ?? ''), inr);
          }}
        />
        {renderCountSeries()}
        {renderInrSeries()}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PartnerDashboardAnalyticsChart({ className }: { className?: string }) {
  const mounted = useMounted();
  const reduceMotion = usePrefersReducedMotion();
  const { period } = usePartnerDashboardPeriod();
  const { chartType, setChartType } = usePartnerDashboardChartType();
  const overviewQ = usePartnerAnalyticsOverview(period);

  const loading = !mounted || overviewQ.isLoading;
  const overview = mounted ? overviewQ.data : undefined;
  const rows = useMemo(() => mapChartSeries(overview?.chart_series), [overview?.chart_series]);
  const pieRows = useMemo(() => (overview ? buildOverviewPieRows(overview) : []), [overview]);
  const hasChartData = periodHasActivity(overview, rows);
  const summary = buildAccessibleSummary(overview, overview?.period_label_ist);
  const animate = !reduceMotion;

  if (overviewQ.isError) {
    return (
      <PartnerOpsSurface className={className} aria-label="Analytics chart">
        <PartnerOpsSectionLabel>Analytics</PartnerOpsSectionLabel>
        <div className="mt-3">
          <QueryErrorState
            title="Could not load chart"
            message={getApiErrorMessage(overviewQ.error, 'Chart data failed to load')}

            onRetry={() => void overviewQ.refetch()}

            isRetrying={overviewQ.isFetching}

          />

        </div>

      </PartnerOpsSurface>

    );

  }



  return (

    <PartnerOpsSurface className={className} aria-label="Analytics chart">

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">

        <PartnerOpsSectionLabel className="mb-0">Analytics</PartnerOpsSectionLabel>

        <ChartTypeToggle chartType={chartType} onChange={setChartType} />

      </div>



      {loading ? (

        <Skeleton className="mt-4 h-64 w-full rounded-3xl" />

      ) : !hasChartData ? (

        <div className="mt-4 space-y-2 rounded-3xl bg-muted/40 p-4 text-sm text-muted-foreground">

          <p>No activity in this period yet.</p>

          <Link

            href="/partner/revenue"

            className="font-medium text-primary underline-offset-4 hover:underline"

          >

            Open revenue

          </Link>

        </div>

      ) : (

        <div className="mt-4 space-y-2">

          <p className="text-xs text-muted-foreground">
            {chartType === 'pie'
              ? 'Period totals (counts) — revenue and pending ₹ shown below the chart.'
              : 'Over time — left axis: counts · right axis: ₹ (revenue & pending).'}
          </p>
          {chartType === 'pie' && overview ? (
            <p className="text-xs font-medium text-foreground">
              Revenue {formatInr(parseInr(overview.revenue_gross_inr))}
              {' · '}
              Pending {formatInr(parseInr(overview.pending_payment_inr))}
            </p>
          ) : null}
          <MetricColorLegend />
          <div className="h-64 w-full" role="img" aria-label="Period analytics chart">

            <p className="sr-only">{summary}</p>

            {chartType === 'pie' ? (

              <OverviewPieChart rows={pieRows} animate={animate} />

            ) : (

              <MultiMetricTimeChart chartType={chartType} rows={rows} animate={animate} />

            )}

          </div>

        </div>

      )}

    </PartnerOpsSurface>

  );

}

