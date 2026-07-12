'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { DisputeAnalyticsCharts } from '@/services/dispute-analytics';
import { cn } from '@/lib/utils';

type TabId = 'laundry' | 'customer' | 'type' | 'region' | 'monthly';

const TABS: { id: TabId; label: string }[] = [
  { id: 'laundry', label: 'By laundry' },
  { id: 'customer', label: 'By customer' },
  { id: 'type', label: 'By type' },
  { id: 'region', label: 'By region' },
  { id: 'monthly', label: 'Monthly trend' },
];

type Props = { data: DisputeAnalyticsCharts | undefined; loading?: boolean };

export function DisputeAnalyticsCharts({ data, loading }: Props) {
  const [tab, setTab] = useState<TabId>('laundry');

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />;
  }
  if (!data) return null;

  const barData = (key: keyof DisputeAnalyticsCharts) =>
    (data[key] as Array<{ label: string; value: string; orders?: number }>).map((d) => ({
      name: d.label.length > 18 ? `${d.label.slice(0, 16)}…` : d.label,
      fullName: d.label,
      value: Number(d.value),
      orders: d.orders ?? 0,
    }));

  const monthlyData = data.monthly_trend.map((m) => ({
    name: m.month,
    disputes: m.disputes,
    resolved: m.resolved,
    refund: Number(m.refund_amount_inr),
  }));

  return (
    <AdminPanel
      title="Dispute trends"
      toolbar={
        <div className="flex max-w-full flex-wrap gap-0.5 rounded-lg bg-muted/60 p-0.5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-4 pt-3"
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'monthly' ? (
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v, name) =>
                  name === 'refund' ? formatInr(Number(v)) : v
                }
              />
              <Line
                type="monotone"
                dataKey="disputes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Disputes"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="hsl(var(--chart-2, var(--primary)))"
                strokeWidth={2}
                name="Resolved"
                dot={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={barData(
                tab === 'laundry'
                  ? 'disputes_by_laundry'
                  : tab === 'customer'
                    ? 'disputes_by_customer'
                    : tab === 'type'
                      ? 'disputes_by_type'
                      : 'disputes_by_region',
              )}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Disputes" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </AdminPanel>
  );
}
