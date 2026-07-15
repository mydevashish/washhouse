'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Crown,
  IndianRupee,
  RefreshCw,
  Star,
  TrendingDown,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import {
  getPartnerCustomerInsightsDashboard,
  listPartnerCustomerInsights,
  type CustomerInsightRow,
  type CustomerListType,
  type CustomerSegment,
} from '@/services/customer-insights';

const LIST_TABS: { id: CustomerListType | 'all'; label: string; icon: typeof Users }[] = [
  { id: 'all', label: 'All customers', icon: Users },
  { id: 'top', label: 'Top customers', icon: Star },
  { id: 'repeat', label: 'Repeat', icon: RefreshCw },
  { id: 'vip', label: 'VIP', icon: Crown },
  { id: 'inactive', label: 'Inactive', icon: UserX },
  { id: 'high_risk', label: 'High risk', icon: AlertTriangle },
];

const SEGMENT_OPTIONS: { value: CustomerSegment | ''; label: string }[] = [
  { value: '', label: 'All segments' },
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'vip', label: 'VIP' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'inactive', label: 'Inactive' },
];

function segmentBadgeClass(segment: CustomerSegment): string {
  switch (segment) {
    case 'vip':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'new':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
    case 'active':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'at_risk':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'inactive':
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
}

function riskBadgeClass(label: string): string {
  if (label === 'High' || label === 'Critical') return 'bg-destructive/15 text-destructive';
  if (label === 'Medium') return 'bg-warning/15 text-warning';
  return 'bg-muted text-muted-foreground';
}

function retentionBarClass(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-destructive';
}

function CustomerTable({ rows }: { rows: CustomerInsightRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5">Customer</th>
            <th className="px-4 py-2.5">Segment</th>
            <th className="px-4 py-2.5">Lifetime spend</th>
            <th className="px-4 py-2.5">Orders</th>
            <th className="px-4 py-2.5">Avg order</th>
            <th className="px-4 py-2.5">Last order</th>
            <th className="px-4 py-2.5">Retention</th>
            <th className="px-4 py-2.5">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((c) => (
            <tr key={c.user_id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{c.name}</p>
                {c.is_high_risk && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {c.dispute_count > 0 ? `${c.dispute_count} dispute${c.dispute_count === 1 ? '' : 's'}` : 'Elevated risk'}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge className={cn('font-normal', segmentBadgeClass(c.segment))}>{c.segment_label}</Badge>
              </td>
              <td className="px-4 py-3 tabular-nums">{formatInr(Number(c.lifetime_spend_inr))}</td>
              <td className="px-4 py-3 tabular-nums">{c.order_count}</td>
              <td className="px-4 py-3 tabular-nums">{formatInr(Number(c.avg_order_value_inr))}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.last_order_at ? <ClientDate iso={c.last_order_at} mode="date" /> : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', retentionBarClass(c.retention_score))}
                      style={{ width: `${c.retention_score}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground">{c.retention_score}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={cn('font-normal', riskBadgeClass(c.risk_label))}>
                  {c.risk_label}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PartnerCustomersView() {
  const enabled = usePartnerQueriesEnabled();
  const [listTab, setListTab] = useState<CustomerListType | 'all'>('all');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | ''>('');

  const dashboardQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const customersQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsights(listTab, segmentFilter),
    queryFn: () =>
      listPartnerCustomerInsights({
        list_type: listTab === 'all' ? undefined : listTab,
        segment: segmentFilter || undefined,
        limit: 100,
      }),
    enabled,
    staleTime: 30_000,
  });

  const dashboard = dashboardQ.data;
  const customers = customersQ.data?.items ?? [];
  const tabHint = useMemo(() => {
    if (!dashboard) return undefined;
    const map: Record<string, number> = {
      all: dashboard.total_customers,
      top: dashboard.lists.top,
      repeat: dashboard.lists.repeat,
      vip: dashboard.lists.vip,
      inactive: dashboard.lists.inactive,
      high_risk: dashboard.lists.high_risk,
    };
    return map[listTab];
  }, [dashboard, listTab]);

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Customer Insights Dashboard"
        description="Top customers, VIPs, repeat buyers, inactive accounts, and high-risk flags — with lifetime spend and retention scores."
      />

      {dashboardQ.isError && (
        <QueryErrorState
          title="Could not load customer insights"
          message={getApiErrorMessage(dashboardQ.error)}
          onRetry={() => void dashboardQ.refetch()}
          isRetrying={dashboardQ.isFetching}
        />
      )}

      <PartnerKpiGrid>
        <PartnerKpiCard
          label="Total customers"
          value={dashboard ? String(dashboard.total_customers) : '—'}
          icon={Users}
          loading={dashboardQ.isLoading}
        />
        <PartnerKpiCard
          label="Avg lifetime spend"
          value={dashboard ? formatInr(Number(dashboard.avg_lifetime_spend_inr)) : '—'}
          icon={Star}
          loading={dashboardQ.isLoading}
          accent="success"
        />
        <PartnerKpiCard
          label="Avg order value"
          value={dashboard ? formatInr(Number(dashboard.avg_order_value_inr)) : '—'}
          icon={IndianRupee}
          loading={dashboardQ.isLoading}
        />
        <PartnerKpiCard
          label="Avg retention score"
          value={dashboard ? dashboard.avg_retention_score : '—'}
          hint="0–100 composite"
          icon={RefreshCw}
          loading={dashboardQ.isLoading}
        />
        <PartnerKpiCard
          label="VIP customers"
          value={dashboard ? String(dashboard.segments.vip) : '—'}
          icon={Crown}
          loading={dashboardQ.isLoading}
          accent="success"
        />
        <PartnerKpiCard
          label="High risk"
          value={dashboard ? String(dashboard.lists.high_risk) : '—'}
          icon={AlertTriangle}
          loading={dashboardQ.isLoading}
          accent="warning"
        />
      </PartnerKpiGrid>

      {dashboard && (
        <PartnerPanel title="Segments" meta="Customer lifecycle breakdown">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                { key: 'new', label: 'New', icon: UserPlus, count: dashboard.segments.new },
                { key: 'active', label: 'Active', icon: Users, count: dashboard.segments.active },
                { key: 'vip', label: 'VIP', icon: Crown, count: dashboard.segments.vip },
                { key: 'at_risk', label: 'At risk', icon: TrendingDown, count: dashboard.segments.at_risk },
                { key: 'inactive', label: 'Inactive', icon: UserX, count: dashboard.segments.inactive },
              ] as const
            ).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setListTab('all');
                  setSegmentFilter(key);
                }}
                className={cn(
                  'rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/40',
                  segmentFilter === key && 'ring-2 ring-primary/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{count}</p>
              </button>
            ))}
          </div>
        </PartnerPanel>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {LIST_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setListTab(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                listTab === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted/40',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as CustomerSegment | '')}
            aria-label="Filter by segment"
          >
            {SEGMENT_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {(customersQ.isLoading || dashboardQ.isLoading) && <Skeleton className="h-64 w-full rounded-2xl" />}

      {customersQ.isError && (
        <QueryErrorState
          title="Could not load customer list"
          message={getApiErrorMessage(customersQ.error)}
          onRetry={() => void customersQ.refetch()}
          isRetrying={customersQ.isFetching}
        />
      )}

      {enabled && !customersQ.isPending && customers.length === 0 && (
        <EmptyState
          icon={Users}
          title="No customers in this view"
          description="Try another list or segment filter."
        />
      )}

      {customers.length > 0 && (
        <PartnerPanel
          meta={
            tabHint !== undefined
              ? `${customers.length} shown${customersQ.data && customersQ.data.total > customers.length ? ` of ${customersQ.data.total}` : ''}`
              : undefined
          }
          bodyClassName="p-0"
        >
          <CustomerTable rows={customers} />
        </PartnerPanel>
      )}
    </PartnerContent>
  );
}
