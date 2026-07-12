'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, ClipboardCheck, IndianRupee, Package, Percent, Store, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminAnalyticsCharts } from '@/features/admin/charts/admin-analytics-charts';
import { AdminTopLaundriesWidget } from '@/features/admin/revenue-analytics/admin-top-laundries-widget';
import { AdminAlertsStrip } from '@/features/admin/components/admin-alerts-strip';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getAdminAnalytics, getAdminDashboard } from '@/services/admin';

function trendSeries(
  points: Array<{ orders?: number; revenue_inr?: string; new_customers?: number; new_laundries?: number }>,
  key: 'orders' | 'revenue_inr' | 'new_customers' | 'new_laundries',
): number[] {
  return points.map((p) => {
    if (key === 'revenue_inr') return Number(p.revenue_inr ?? 0);
    return Number(p[key] ?? 0);
  });
}

function pctChange(series: number[]): { value: string; positive: boolean } | undefined {
  if (series.length < 2) return undefined;
  const prev = series[series.length - 2]!;
  const curr = series[series.length - 1]!;
  if (prev === 0 && curr === 0) return undefined;
  if (prev === 0) return { value: '+100% vs yesterday', positive: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return {
    value: `${pct >= 0 ? '+' : ''}${pct}% vs yesterday`,
    positive: pct >= 0,
  };
}

export function AdminOverviewView() {
  const router = useRouter();
  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboard,
    staleTime: STALE.adminDashboard,
  });
  const analyticsQ = useQuery({
    queryKey: queryKeys.adminAnalytics(14),
    queryFn: () => getAdminAnalytics(14),
    staleTime: STALE.adminDashboard,
  });

  const d = dashboardQ.data;
  const pending = d?.laundries_pending ?? 0;
  const trend = analyticsQ.data?.orders_trend ?? [];
  const ordersSeries = trendSeries(trend, 'orders');
  const revenueSeries = trendSeries(trend, 'revenue_inr');
  const customersSeries = trendSeries(trend, 'new_customers');
  const laundriesSeries = trendSeries(trend, 'new_laundries');

  return (
    <AdminContent className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          title="Overview"
          description="Live marketplace health, KPIs, and trends."
          className="sm:flex-1"
        />
        <Button type="button" size="sm" variant="outline" asChild>
          <Link href="/admin/business-health">
            <Activity className="mr-1.5 h-4 w-4" aria-hidden />
            Business health
          </Link>
        </Button>
        <AdminAlertsStrip dashboard={d} />
      </div>

      {dashboardQ.isError && (
        <InfoBanner variant="destructive" title="Could not load dashboard metrics">
          {getApiErrorMessage(dashboardQ.error, 'GET /admin/dashboard failed')}
        </InfoBanner>
      )}
      {analyticsQ.isError && (
        <InfoBanner variant="destructive" title="Could not load analytics">
          {getApiErrorMessage(analyticsQ.error, 'GET /admin/analytics failed')}
        </InfoBanner>
      )}

      <KpiGrid>
        <KpiCard
          label="Active laundries"
          value={d ? formatCount(d.laundries_approved) : '—'}
          change={
            pending > 0 ? { value: `${pending} pending`, positive: false } : pctChange(laundriesSeries)
          }
          sparkline={laundriesSeries}
          status={pending > 0 ? 'warning' : 'healthy'}
          icon={Store}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/laundries')}
        />
        <KpiCard
          label="Customers"
          value={d ? formatCount(d.customers_total) : '—'}
          change={pctChange(customersSeries)}
          sparkline={customersSeries}
          status="healthy"
          icon={Users}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/customers')}
        />
        <KpiCard
          label="Orders today"
          value={d ? formatCount(d.orders_today) : '—'}
          change={
            d && d.orders_in_progress > 0
              ? { value: `${d.orders_in_progress} in progress`, positive: true }
              : pctChange(ordersSeries)
          }
          sparkline={ordersSeries}
          status="neutral"
          icon={Package}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/orders')}
        />
        <KpiCard
          label="Revenue (MTD)"
          value={d ? formatInrCompact(Number(d.revenue_month_inr)) : '—'}
          change={pctChange(revenueSeries)}
          sparkline={revenueSeries}
          status="healthy"
          icon={IndianRupee}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/revenue/analytics')}
        />
        <KpiCard
          label="Commission (MTD)"
          value={d ? formatInrCompact(Number(d.commission_month_inr)) : '—'}
          change={{ value: 'Estimated', positive: true }}
          sparkline={revenueSeries}
          status="neutral"
          icon={Percent}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/commission')}
        />
        <KpiCard
          label="Approvals"
          value={d ? String(pending) : '—'}
          change={
            pending > 0 ? { value: 'Action required', positive: false } : { value: 'Clear', positive: true }
          }
          status={pending > 0 ? 'critical' : 'healthy'}
          icon={ClipboardCheck}
          loading={dashboardQ.isLoading}
          onClick={() => router.push('/admin/approvals')}
        />
      </KpiGrid>

      {analyticsQ.data && <AdminAnalyticsCharts data={analyticsQ.data} />}
      <AdminTopLaundriesWidget />
      {analyticsQ.isLoading && (
        <div className="h-48 animate-pulse rounded-2xl bg-muted/50 ring-1 ring-border/40" aria-busy="true" />
      )}
    </AdminContent>
  );
}
