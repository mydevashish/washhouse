'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  Scale,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { BusinessHealthCharts } from '@/features/admin/business-health/business-health-charts';
import { KpiCard, KpiGrid, type KpiStatus } from '@/features/admin/components/kpi-card';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { formatGrowthPct, getBusinessHealthDashboard } from '@/services/business-health';
import { cn } from '@/lib/utils';

function growthChange(pct: number | null | undefined) {
  if (pct == null) return undefined;
  return { value: `${formatGrowthPct(pct)} vs last month`, positive: pct >= 0 };
}

function alertSeverityClass(severity: string) {
  return severity === 'critical'
    ? 'border-destructive/30 bg-destructive/5 text-destructive'
    : 'border-warning/30 bg-warning/5 text-warning';
}

export function AdminBusinessHealthView() {
  const router = useRouter();
  const healthQ = useQuery({
    queryKey: queryKeys.adminBusinessHealth(),
    queryFn: getBusinessHealthDashboard,
    staleTime: STALE.adminDashboard,
    refetchInterval: 60_000,
  });

  const d = healthQ.data;
  const m = d?.metrics;
  const o = d?.operational;
  const g = d?.growth;
  const trendRevenue = (d?.trend ?? []).map((t) => Number(t.revenue_inr));
  const loading = healthQ.isLoading;

  const revenueStatus: KpiStatus =
    m?.revenue_growth_pct != null && m.revenue_growth_pct < -10 ? 'critical' : 'healthy';

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Business health"
        description="Executive snapshot — revenue, growth, operations, and risk alerts at a glance."
      />

      {healthQ.isError && (
        <InfoBanner variant="destructive" title="Could not load business health">
          {getApiErrorMessage(healthQ.error, 'GET /admin/business-health failed')}
        </InfoBanner>
      )}

      {d && d.alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alerts</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-opacity hover:opacity-90',
                  alertSeverityClass(alert.severity),
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    <p className="font-semibold">{alert.title}</p>
                    <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-bold tabular-nums">
                      {alert.metric_value}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{alert.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      )}

      {d && d.alerts.length === 0 && !loading && (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success ring-1 ring-success/20">
          All clear — no executive alerts right now.
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core metrics</p>
        <KpiGrid>
          <KpiCard
            label="Revenue today"
            value={m ? formatInrCompact(Number(m.revenue_today_inr)) : '—'}
            icon={IndianRupee}
            loading={loading}
            status="healthy"
            onClick={() => router.push('/admin/revenue/analytics')}
          />
          <KpiCard
            label="Revenue this month"
            value={m ? formatInrCompact(Number(m.revenue_month_inr)) : '—'}
            change={growthChange(m?.revenue_growth_pct)}
            sparkline={trendRevenue}
            icon={TrendingUp}
            loading={loading}
            status={revenueStatus}
            onClick={() => router.push('/admin/revenue/analytics')}
          />
          <KpiCard
            label="Revenue growth"
            value={m ? formatGrowthPct(m.revenue_growth_pct) : '—'}
            change={{ value: 'Month over month', positive: (m?.revenue_growth_pct ?? 0) >= 0 }}
            icon={TrendingUp}
            loading={loading}
            status={revenueStatus}
          />
          <KpiCard
            label="Orders today"
            value={m ? formatCount(m.orders_today) : '—'}
            icon={Package}
            loading={loading}
            onClick={() => router.push('/admin/orders')}
          />
          <KpiCard
            label="Orders this month"
            value={m ? formatCount(m.orders_month) : '—'}
            change={growthChange(m?.order_growth_pct ?? g?.order_growth_pct)}
            icon={Package}
            loading={loading}
            onClick={() => router.push('/admin/orders')}
          />
          <KpiCard
            label="Order growth"
            value={m ? formatGrowthPct(m.order_growth_pct) : '—'}
            change={{ value: 'Month over month', positive: (m?.order_growth_pct ?? 0) >= 0 }}
            icon={TrendingUp}
            loading={loading}
          />
          <KpiCard
            label="Average order value"
            value={m ? formatInrCompact(Number(m.average_order_value_inr)) : '—'}
            icon={IndianRupee}
            loading={loading}
            status="neutral"
          />
          <KpiCard
            label="Active customers"
            value={m ? formatCount(m.active_customers) : '—'}
            change={m ? { value: `${formatCount(m.total_customers)} total`, positive: true } : undefined}
            icon={Users}
            loading={loading}
            onClick={() => router.push('/admin/customers')}
          />
          <KpiCard
            label="New customers"
            value={m ? formatCount(m.new_customers) : '—'}
            change={{ value: 'This month', positive: true }}
            icon={Users}
            loading={loading}
            onClick={() => router.push('/admin/customers')}
          />
          <KpiCard
            label="Returning customers"
            value={m ? formatCount(m.returning_customers) : '—'}
            change={{ value: '2+ orders in 90 days', positive: true }}
            icon={Users}
            loading={loading}
            onClick={() => router.push('/admin/customers')}
          />
          <KpiCard
            label="Active laundries"
            value={m ? formatCount(m.active_laundries) : '—'}
            change={m ? { value: `${formatCount(m.total_laundries)} approved`, positive: true } : undefined}
            icon={Store}
            loading={loading}
            onClick={() => router.push('/admin/laundries')}
          />
          <KpiCard
            label="Top laundry"
            value={m?.top_laundry_name ? m.top_laundry_name : '—'}
            change={
              m?.top_laundry_revenue_inr
                ? { value: `${formatInrCompact(Number(m.top_laundry_revenue_inr))} MTD`, positive: true }
                : undefined
            }
            icon={Store}
            loading={loading}
            onClick={() => router.push('/admin/laundries')}
          />
          <KpiCard
            label="Lowest performing laundry"
            value={m?.lowest_laundry_name ? m.lowest_laundry_name : '—'}
            change={
              m?.lowest_laundry_revenue_inr
                ? { value: `${formatInrCompact(Number(m.lowest_laundry_revenue_inr))} MTD`, positive: false }
                : undefined
            }
            icon={Store}
            loading={loading}
            status="neutral"
            onClick={() => router.push('/admin/laundries')}
          />
        </KpiGrid>
      </div>

      <BusinessHealthCharts data={d?.charts} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Operational metrics" bodyClassName="grid gap-2 px-4 py-4 sm:grid-cols-3">
          {[
            { label: 'Open disputes', value: o?.open_disputes, href: '/admin/disputes', icon: Scale, status: (o?.open_disputes ?? 0) > 0 ? 'warning' as const : 'healthy' as const },
            { label: 'Pending refunds', value: o?.pending_refunds, href: '/admin/disputes', icon: Wallet, status: (o?.pending_refunds ?? 0) > 0 ? 'warning' as const : 'healthy' as const },
            { label: 'Pending settlements', value: o?.pending_settlements, href: '/admin/settlements', icon: Wallet, status: (o?.pending_settlements ?? 0) >= 5 ? 'critical' as const : 'neutral' as const },
            { label: 'Failed deliveries', value: o?.failed_deliveries, href: '/admin/orders', icon: Truck, status: (o?.failed_deliveries ?? 0) > 0 ? 'warning' as const : 'healthy' as const },
            { label: 'Delayed orders', value: o?.delayed_orders, href: '/admin/orders', icon: Package, status: (o?.delayed_orders ?? 0) > 0 ? 'warning' as const : 'healthy' as const },
            { label: 'Delayed settlements', value: o?.delayed_settlements, href: '/admin/settlements', icon: AlertTriangle, status: (o?.delayed_settlements ?? 0) > 0 ? 'critical' as const : 'healthy' as const },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5 ring-1 ring-border/40 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className={cn('text-sm font-semibold tabular-nums', item.status === 'critical' && 'text-destructive', item.status === 'warning' && 'text-warning')}>
                {loading ? '—' : formatCount(item.value ?? 0)}
              </span>
            </Link>
          ))}
        </AdminPanel>

        <AdminPanel title="Growth metrics" bodyClassName="px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Customer growth', pct: g?.customer_growth_pct, sub: g ? `${g.new_customers_month} new this month` : undefined },
              { label: 'Laundry growth', pct: g?.laundry_growth_pct, sub: g ? `${g.new_laundries_month} new this month` : undefined },
              { label: 'Order growth', pct: g?.order_growth_pct },
              { label: 'Revenue growth', pct: g?.revenue_growth_pct },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-muted/30 px-3 py-2.5 ring-1 ring-border/40">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className={cn('text-lg font-semibold tabular-nums', (row.pct ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>
                  {loading ? '—' : formatGrowthPct(row.pct)}
                </p>
                {row.sub && <p className="text-[10px] text-muted-foreground">{row.sub}</p>}
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminContent>
  );
}
