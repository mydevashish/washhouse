'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  PackageCheck,
  Shirt,
  Sparkles,
  Star,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { PartnerCreateOrderDialog } from '@/features/partner/components/partner-create-order-dialog';
import { PartnerLaundryRecentOrdersCard, PartnerLaundryTopCustomersCard } from '@/features/partner/components/partner-laundry-dashboard-lists';
import { usePartnerDashboardPeriodOptional } from '@/features/partner/dashboard/partner-dashboard-period';
import {
  usePartnerAnalyticsDashboard,
  usePartnerOrders,
  usePartnerTopCustomers,
} from '@/features/partner/hooks/use-partner-operations';
import {
  formatKpiDeltaPct,
  kpiGrowth,
  mapPartnerDashboardKpiCards,
  partnerDashboardWelcomeTitle,
  type PartnerDashboardKpiCard,
} from '@/features/partner/lib/partner-dashboard-kpi-cards';
import {
  CHART_PREVIOUS_PERIOD_LABEL,
  getChartTheme,
  mapPartnerDashboardChartSeries,
  sumChartSeries,
} from '@/features/partner/lib/partner-dashboard-chart';
import {
  chartChipToDashboardPeriod,
  dashboardPeriodToChartChip,
  mapPartnerDashboardDonut,
  mapPartnerDashboardStatusCards,
} from '@/features/partner/lib/partner-dashboard-status';
import {
  mapPartnerDashboardPaymentRows,
  mapPartnerDashboardTopServices,
  PARTNER_DASHBOARD_PAYMENTS_VIEW_ALL_HREF,
  PARTNER_DASHBOARD_SERVICES_HREF,
} from '@/features/partner/lib/partner-dashboard-mix';
import { mapPartnerDashboardBottomStats } from '@/features/partner/lib/partner-dashboard-bottom';
import { mapPartnerDashboardRecentOrders, mapPartnerDashboardTopCustomers } from '@/features/partner/lib/partner-dashboard-lists';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { PartnerAnalyticsDashboardPeriod } from '@/services/partner';

function KpiCardSkeletons() {
  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      aria-busy="true"
      aria-label="Loading dashboard metrics"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-[20px] shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-4 h-5 w-full" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function PartnerDashboardKpiCardView({ card }: { card: PartnerDashboardKpiCard }) {
  const ArrowIcon = card.up ? ArrowUpRight : ArrowDownRight;
  const deltaText = formatKpiDeltaPct(card.deltaPct, card.up);
  const hasDelta = card.deltaPct !== null;
  const badgeTone = !hasDelta
    ? 'bg-muted text-muted-foreground'
    : card.up
      ? 'bg-success-muted text-success'
      : 'bg-danger-muted text-danger';
  const displayValue =
    card.kind === 'revenue' ? formatInr(card.value) : card.value.toLocaleString('en-IN');
  const previousValue =
    card.kind === 'revenue' ? formatInr(card.previous) : card.previous.toLocaleString('en-IN');

  return (
    <Card
      className={`rounded-[20px] shadow-sm ${card.kind === 'revenue' ? 'bg-gradient-to-br from-[#f5f3ff] to-white dark:bg-none dark:bg-card' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] text-muted-foreground">{card.title}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-[28px] font-semibold leading-none text-foreground">{displayValue}</span>
              <span className="mb-1 text-[12px] text-muted-foreground">{card.currentLabel}</span>
            </div>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
            <ArrowIcon className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground">{previousValue}</span>
            <span className="ml-1">{card.previousLabel}</span>
          </div>
          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${badgeTone}`}>
            {hasDelta ? <ArrowIcon className="h-3 w-3" aria-hidden /> : null}
            {deltaText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCardSkeletons() {
  return (
    <section
      className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading order status"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-[20px] shadow-sm">
          <CardContent className="p-3.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

const STATUS_CARD_ICONS = {
  in_process: PackageCheck,
  ready_for_delivery: Check,
  completed: Check,
} as const;

const STATUS_TONE_CLASS: Record<string, string> = {
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  purple: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
};

function BottomStatSkeletons() {
  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      aria-busy="true"
      aria-label="Loading customer stats"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-[18px] shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

const BOTTOM_STAT_ICONS = {
  users: Users,
  shirt: Shirt,
  truck: Truck,
  star: Star,
} as const;

const revenuePeriods = ['Today', 'Week', 'Month', 'Year'] as const;

export function PartnerLaundryDashboardView() {
  const queryClient = useQueryClient();
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const chartTheme = getChartTheme(mounted && resolvedTheme === 'dark');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const periodCtx = usePartnerDashboardPeriodOptional();
  const [localPeriod, setLocalPeriod] = useState<PartnerAnalyticsDashboardPeriod>('week');
  const dashboardPeriod = periodCtx?.period ?? localPeriod;
  const setDashboardPeriod = periodCtx?.setPeriod ?? setLocalPeriod;
  const selectedPeriod = dashboardPeriodToChartChip(dashboardPeriod);
  const userFullName = useAuthStore((s) => s.user?.full_name);
  const dashboardQ = usePartnerAnalyticsDashboard(dashboardPeriod);
  const recentOrdersQ = usePartnerOrders({
    page: 1,
    page_size: 5,
    sort_by: 'created_at',
    sort_order: 'desc',
    bucket: 'all',
  });
  const topCustomersQ = usePartnerTopCustomers();

  const chartData = mapPartnerDashboardChartSeries(
    dashboardQ.data?.period === dashboardPeriod ? dashboardQ.data.chart_series : undefined,
  );
  const currentTotal = sumChartSeries(chartData, 'current');
  const previousTotal = sumChartSeries(chartData, 'previous');
  const comparison = kpiGrowth(currentTotal, previousTotal);
  const previousPeriodLabel = CHART_PREVIOUS_PERIOD_LABEL[dashboardPeriod];
  const comparisonLabel =
    comparison.deltaPct === null
      ? `— vs ${previousPeriodLabel}`
      : `${formatKpiDeltaPct(comparison.deltaPct, comparison.up)} vs ${previousPeriodLabel}`;
  const periodReady = Boolean(dashboardQ.data && dashboardQ.data.period === dashboardPeriod);
  const chartLoading = !dashboardQ.isError && !periodReady;
  const chartEmpty = !chartLoading && chartData.length === 0;
  const activeMetricColor = '#4f46e5';
  const previousPeriodColor = '#94a3b8';

  const kpiCards = dashboardQ.data ? mapPartnerDashboardKpiCards(dashboardQ.data.kpis) : [];
  const welcomeTitle = partnerDashboardWelcomeTitle(dashboardQ.data?.laundry_name, userFullName);
  const kpisLoading = dashboardQ.isLoading || dashboardQ.isPending;
  const kpisFailed = dashboardQ.isError;
  const statusCards = mapPartnerDashboardStatusCards(
    dashboardQ.data?.status_snapshot ?? {
      in_process: 0,
      ready_for_delivery: 0,
      completed: 0,
    },
  );
  const donut = mapPartnerDashboardDonut(
    periodReady && dashboardQ.data
      ? dashboardQ.data.status_donut
      : { in_process: 0, ready: 0, completed: 0 },
  );
  const donutPeriodLabel = periodReady ? dashboardQ.data?.period_label_ist : undefined;
  const topServiceRows = mapPartnerDashboardTopServices(
    periodReady ? dashboardQ.data?.top_services : undefined,
  );
  const paymentRows = mapPartnerDashboardPaymentRows(
    periodReady && dashboardQ.data
      ? dashboardQ.data.payment_summary
      : {
          cash_paid_inr: '0.00',
          upi_paid_inr: '0.00',
          wallet_tracked: false,
          pending_inr: '0.00',
        },
  );
  const recentOrderRows = mapPartnerDashboardRecentOrders(recentOrdersQ.data?.items).slice(0, 5);
  const topCustomerRows = mapPartnerDashboardTopCustomers(topCustomersQ.data?.items).slice(0, 5);
  const bottomStatRows = mapPartnerDashboardBottomStats(dashboardQ.data?.bottom);
  const bottomLoading = kpisLoading && !dashboardQ.data;

  const handleOrderCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-analytics-dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
    void queryClient.invalidateQueries({ queryKey: ['partner-analytics-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-customer-insights'] });
  };

  return (
    <div className="min-h-0 bg-muted/30 px-4 py-5 text-foreground lg:px-6 dark:bg-background">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 rounded-[20px] bg-transparent px-2 py-1 md:flex-row md:items-center md:justify-between">
          <div>
            {kpisLoading && !dashboardQ.data ? (
              <Skeleton className="h-[31px] w-[min(100%,22rem)]" aria-label="Loading laundry name" />
            ) : (
              <h1 className="text-[31px] font-semibold tracking-[-0.05em] text-foreground">
                {welcomeTitle} <span className="text-[22px]">👋</span>
              </h1>
            )}
            <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at your franchise today.</p>
          </div>
          <Button
            type="button"
            onClick={() => setCreateOrderOpen(true)}
            data-testid="partner-dashboard-create-order"
            className="min-h-11 shrink-0 rounded-full bg-indigo-600 px-5 hover:bg-indigo-700 focus-visible:ring-indigo-400"
          >
            Create order
          </Button>
        </header>

        <PartnerCreateOrderDialog
          open={createOrderOpen}
          onOpenChange={setCreateOrderOpen}
          onOrderCreated={handleOrderCreated}
        />

        {kpisFailed ? (
          <QueryErrorState
            title="Could not load dashboard metrics"
            message={getApiErrorMessage(dashboardQ.error, "We could not load today's orders and revenue.")}
            onRetry={() => {
              void dashboardQ.refetch();
            }}
            isRetrying={dashboardQ.isFetching}
          />
        ) : kpisLoading && !dashboardQ.data ? (
          <KpiCardSkeletons />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpiCards.map((card) => (
              <PartnerDashboardKpiCardView key={`${card.kind}-${card.title}`} card={card} />
            ))}
          </section>
        )}

        {kpisLoading && !dashboardQ.data ? (
          <StatusCardSkeletons />
        ) : (
          <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {statusCards.map((item) => {
              const Icon = STATUS_CARD_ICONS[item.key];
              return (
                <Card key={item.key} className="overflow-hidden rounded-[20px] shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STATUS_TONE_CLASS[item.tone]}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <Link
                        href={item.href}
                        aria-label={`View all ${item.label}`}
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-end text-[10px] font-medium text-primary hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="mt-4 min-w-0">
                      <div className="text-[28px] font-semibold leading-none text-foreground">
                        {item.value.toLocaleString('en-IN')}
                      </div>
                      <div className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{item.label}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr_1fr]">
          <Card className="rounded-[18px] shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Overview</p>
                    <h3 className="mt-1 text-[16px] font-semibold text-foreground">Total Revenue</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Revenue chart period">
                  {revenuePeriods.map((period) => (
                    <button
                      key={period}
                      type="button"
                      aria-pressed={selectedPeriod === period}
                      data-testid={`partner-dashboard-period-${period.toLowerCase()}`}
                      onClick={() => setDashboardPeriod(chartChipToDashboardPeriod(period))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        selectedPeriod === period
                          ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-primary/15 dark:text-primary dark:ring-primary/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                <div className="inline-flex w-fit rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                  Revenue
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[28px] font-semibold text-foreground">
                    {chartLoading ? '—' : formatInr(currentTotal)}
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-2 text-xs ${
                      comparison.deltaPct === null
                        ? 'text-muted-foreground'
                        : comparison.up
                          ? 'text-emerald-600'
                          : 'text-red-600'
                    }`}
                  >
                    {comparison.deltaPct === null ? null : comparison.up ? (
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {chartLoading ? '—' : comparisonLabel}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted px-3 py-2 text-right">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{previousPeriodLabel}</div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {chartLoading ? '—' : formatInr(previousTotal)}
                  </div>
                </div>
              </div>

              <div className="relative mt-5 h-72 rounded-xl bg-muted/40 bg-gradient-to-b from-sky-50 to-white p-3 dark:from-muted/20 dark:to-card">
                {chartLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" aria-label="Loading revenue chart" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={chartTheme.gridStroke} strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: chartTheme.axisTickFill }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: chartTheme.axisTickFill }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                          tickFormatter={(value) => {
                          if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                          return `₹${value}`;
                        }} />
                        <Tooltip
                          formatter={(value, name) => {
                            const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                            return [formatInr(numericValue), name === 'current' ? 'Current' : 'Previous'];
                          }}
                          labelFormatter={(label) => `${label}`}
                          contentStyle={{
                            borderRadius: '12px',
                            borderColor: chartTheme.tooltip.borderColor,
                            backgroundColor: chartTheme.tooltip.backgroundColor,
                            color: chartTheme.tooltip.color,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="current"
                          name="current"
                          stroke={activeMetricColor}
                          strokeWidth={3}
                          dot={{ r: 3, fill: activeMetricColor }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="previous"
                          name="previous"
                          stroke={previousPeriodColor}
                          strokeWidth={2.5}
                          strokeDasharray="6 6"
                          dot={{ r: 2.5, fill: previousPeriodColor }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    {chartEmpty ? (
                      <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                        No revenue in this period
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Orders by Status</p>
                  <h3 className="mt-1 text-[16px] font-semibold text-foreground">
                    Total {chartLoading ? '—' : donut.total.toLocaleString('en-IN')}
                  </h3>
                </div>
                {chartLoading ? (
                  <Skeleton className="h-7 w-28 rounded-lg" />
                ) : (
                  <div
                    className="max-w-[11rem] truncate rounded-lg border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                    title={donutPeriodLabel}
                  >
                    {donutPeriodLabel || selectedPeriod}
                  </div>
                )}
              </div>

              {chartLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : donut.isEmpty ? (
                <p className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                  No orders in this period
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-center py-4">
                    <div
                      className="relative flex h-40 w-40 items-center justify-center rounded-full"
                      style={{ background: `conic-gradient(${donut.gradient})` }}
                      role="img"
                      aria-label={`Orders by status: ${donut.slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card text-center shadow-inner">
                        <div>
                          <div className="text-[20px] font-semibold text-foreground">{donut.total}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {donut.slices.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span>
                          {item.value} ({item.percentage.toFixed(2)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[18px] shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Top Services</p>
                </div>
                {chartLoading ? (
                  <Skeleton className="h-7 w-28 rounded-lg" />
                ) : (
                  <div
                    className="max-w-[11rem] truncate rounded-lg border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
                    title={donutPeriodLabel}
                  >
                    {donutPeriodLabel || selectedPeriod}
                  </div>
                )}
              </div>

              {chartLoading ? (
                <div className="space-y-4" aria-busy="true" aria-label="Loading top services">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-2.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : topServiceRows.length === 0 ? (
                <div className="flex min-h-[10rem] flex-col items-start justify-center gap-3">
                  <p className="text-sm text-muted-foreground">No services in this period</p>
                  <Link
                    href={PARTNER_DASHBOARD_SERVICES_HREF}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                  >
                    Open service catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {topServiceRows.map((service) => (
                    <div key={service.name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                          {service.name}
                        </div>
                        <span className="text-muted-foreground">{service.linesLabel}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-blue-500"
                          style={{ width: `${service.sharePct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-[11px] text-muted-foreground">{service.shareLabel}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.7fr_1.15fr_1.15fr]">
          <PartnerLaundryRecentOrdersCard
            rows={recentOrderRows}
            loading={recentOrdersQ.isLoading || recentOrdersQ.isPending}
            error={
              recentOrdersQ.isError
                ? getApiErrorMessage(recentOrdersQ.error, 'We could not load recent orders.')
                : null
            }
            onRetry={() => {
              void recentOrdersQ.refetch();
            }}
            isRetrying={recentOrdersQ.isFetching}
          />

          <PartnerLaundryTopCustomersCard
            rows={topCustomerRows}
            loading={topCustomersQ.isLoading || topCustomersQ.isPending}
            error={
              topCustomersQ.isError
                ? getApiErrorMessage(topCustomersQ.error, 'We could not load top customers.')
                : null
            }
            onRetry={() => {
              void topCustomersQ.refetch();
            }}
            isRetrying={topCustomersQ.isFetching}
          />

          <Card className="rounded-[18px] shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Payment Summary</h3>
                <Link
                  href={PARTNER_DASHBOARD_PAYMENTS_VIEW_ALL_HREF}
                  aria-label="View all payments"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                >
                  View all
                </Link>
              </div>
              {chartLoading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading payment summary">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentRows.map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.tone}`}>
                          {item.key === 'cash' ? (
                            <Wallet className="h-3.5 w-3.5" aria-hidden />
                          ) : item.key === 'upi' ? (
                            <Sparkles className="h-3.5 w-3.5" aria-hidden />
                          ) : item.key === 'wallet' ? (
                            <Users className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{item.value}</span>
                        {item.hint ? (
                          <div className="text-[11px] font-normal text-muted-foreground">{item.hint}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {bottomLoading ? (
          <BottomStatSkeletons />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {bottomStatRows.map((stat) => {
              const Icon = BOTTOM_STAT_ICONS[stat.icon];
              return (
                <Card key={stat.key} className="rounded-[18px] shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                      <div className="rounded-xl bg-muted p-2 text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>
                    <div className="mt-4 text-[22px] font-semibold text-foreground">{stat.value}</div>
                    {stat.subtitle ? (
                      <div className="mt-2 text-xs text-muted-foreground">{stat.subtitle}</div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
