'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { AdminAnalytics } from '@/services/admin';
import { formatIndiaShortDate } from '@/lib/datetime';
import { cn } from '@/lib/utils';

type TabId = 'trend' | 'cities' | 'laundries';

type AdminAnalyticsChartsProps = {
  data: AdminAnalytics;
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'trend', label: 'Trend' },
  { id: 'cities', label: 'Cities' },
  { id: 'laundries', label: 'Top partners' },
];

export function AdminAnalyticsCharts({ data }: AdminAnalyticsChartsProps) {
  const [tab, setTab] = useState<TabId>('trend');

  const ordersChart = data.orders_trend.map((p) => ({
    ...p,
    label: formatIndiaShortDate(p.date),
    revenue: Number(p.revenue_inr),
  }));

  return (
    <AdminPanel
      title="Analytics"
      description={`Last ${ordersChart.length} days`}
      toolbar={
        <div className="flex rounded-lg bg-muted/60 p-0.5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
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
      {tab === 'trend' && (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ordersChart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value, name) => {
                  if (name === 'revenue') return formatInr(Number(value));
                  return value;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                fill="url(#ordersFill)"
                strokeWidth={2}
                name="Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'cities' && (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_cities} layout="vertical" margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="city" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Laundries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'laundries' && (
        <ul className="max-h-52 divide-y divide-border/50 overflow-y-auto">
          {data.top_laundries.map((l, i) => (
            <li key={`${l.name}-${i}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {l.city} · {l.orders} orders
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatInr(Number(l.revenue_inr))}
              </p>
            </li>
          ))}
          {!data.top_laundries.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">No order data yet</p>
          )}
        </ul>
      )}
    </AdminPanel>
  );
}
