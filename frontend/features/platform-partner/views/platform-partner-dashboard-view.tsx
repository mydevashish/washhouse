'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, IndianRupee, Package, Percent, Store, TrendingUp, Users } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { PlatformPartnerCharts } from '@/features/platform-partner/platform-partner-charts';
import { formatCount, formatInrCompact } from '@/features/admin/lib/format-admin';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  formatGrowthPct,
  getPlatformPartnerDashboard,
} from '@/services/platform-partner-dashboard';
import { formatInr } from '@/features/discover/detail/order-pricing';

function growthChange(pct: number | null | undefined) {
  if (pct == null) return undefined;
  return { value: `${formatGrowthPct(pct)} vs last month`, positive: pct >= 0 };
}

export function PlatformPartnerDashboardView() {
  const dashQ = useQuery({
    queryKey: queryKeys.platformPartnerDashboard(),
    queryFn: getPlatformPartnerDashboard,
    staleTime: STALE.adminDashboard,
    refetchInterval: 60_000,
  });

  const d = dashQ.data;
  const m = d?.metrics;
  const loading = dashQ.isLoading;

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Platform Partner Dashboard"
        description="Read-only marketplace overview — revenue, commission, growth, and rankings. No editing or payout data."
      />

      <InfoBanner variant="default" title="Read-only access">
        This dashboard is view-only. Contact DLM admin for configuration or payout inquiries.
      </InfoBanner>

      {dashQ.isError && (
        <InfoBanner variant="destructive" title="Could not load dashboard">
          {getApiErrorMessage(dashQ.error, 'GET /platform-partner/dashboard failed')}
        </InfoBanner>
      )}

      <KpiGrid className="lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total revenue"
          value={m ? formatInrCompact(Number(m.total_revenue_inr)) : '—'}
          change={growthChange(m?.revenue_growth_pct)}
          icon={IndianRupee}
          loading={loading}
          status="healthy"
        />
        <KpiCard
          label="Platform commission"
          value={m ? formatInrCompact(Number(m.platform_commission_inr)) : '—'}
          icon={Percent}
          loading={loading}
          status="neutral"
        />
        <KpiCard
          label="Active customers"
          value={m ? formatCount(m.active_customers) : '—'}
          change={{ value: '90-day window', positive: true }}
          icon={Users}
          loading={loading}
        />
        <KpiCard
          label="Active laundries"
          value={m ? formatCount(m.active_laundries) : '—'}
          change={{ value: '90-day window', positive: true }}
          icon={Store}
          loading={loading}
        />
        <KpiCard
          label="Orders"
          value={m ? formatCount(m.orders_total) : '—'}
          change={growthChange(m?.orders_growth_pct)}
          icon={Package}
          loading={loading}
        />
        <KpiCard
          label="Revenue growth"
          value={m ? formatGrowthPct(m.revenue_growth_pct) : '—'}
          change={{ value: 'Month over month', positive: (m?.revenue_growth_pct ?? 0) >= 0 }}
          icon={TrendingUp}
          loading={loading}
        />
      </KpiGrid>

      <PlatformPartnerCharts data={d?.charts} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <RankTable
          title="Top laundries"
          icon={Store}
          loading={loading}
          headers={['Laundry', 'City', 'Revenue', 'Orders']}
          rows={(d?.tables.top_laundries ?? []).map((r) => [
            r.name,
            r.city,
            formatInr(Number(r.revenue_inr)),
            String(r.orders),
          ])}
        />
        <RankTable
          title="Top cities"
          icon={BarChart3}
          loading={loading}
          headers={['City', 'Revenue', 'Orders']}
          rows={(d?.tables.top_cities ?? []).map((r) => [
            r.city,
            formatInr(Number(r.revenue_inr)),
            String(r.orders),
          ])}
        />
        <RankTable
          title="Top services"
          icon={Package}
          loading={loading}
          headers={['Service', 'Revenue', 'Qty']}
          rows={(d?.tables.top_services ?? []).map((r) => [
            r.service_name,
            formatInr(Number(r.revenue_inr)),
            String(r.quantity),
          ])}
        />
      </div>
    </AdminContent>
  );
}

function RankTable({
  title,
  icon: Icon,
  loading,
  headers,
  rows,
}: {
  title: string;
  icon: typeof Store;
  loading: boolean;
  headers: string[];
  rows: string[][];
}) {
  return (
    <AdminPanel title={title} meta={<Icon className="h-4 w-4 text-muted-foreground" aria-hidden />} bodyClassName="p-0">
      {loading && <div className="h-40 animate-pulse bg-muted/30" />}
      {!loading && rows.length === 0 && (
        <p className="px-4 py-6 text-sm text-muted-foreground">No data yet.</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  {row.map((cell, j) => (
                    <td key={j} className={cnCell(j, headers.length)}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}

function cnCell(index: number, total: number) {
  const base = 'px-4 py-2.5';
  if (index === total - 1) return `${base} tabular-nums text-right`;
  if (index === total - 2 && total > 3) return `${base} tabular-nums`;
  return base;
}
