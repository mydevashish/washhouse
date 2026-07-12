'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
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
import type { RevenueCharts } from '@/services/revenue-analytics';
import { cn } from '@/lib/utils';

type TabId = 'revenue' | 'orders' | 'commission' | 'growth' | 'monthly';

const TABS: { id: TabId; label: string }[] = [
  { id: 'revenue', label: 'Revenue by laundry' },
  { id: 'orders', label: 'Orders by laundry' },
  { id: 'commission', label: 'Commission by laundry' },
  { id: 'growth', label: 'Revenue growth' },
  { id: 'monthly', label: 'Monthly trend' },
];

type Props = { data: RevenueCharts | undefined; loading?: boolean };

export function RevenueAnalyticsCharts({ data, loading }: Props) {
  const [tab, setTab] = useState<TabId>('revenue');

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />;
  }
  if (!data) return null;

  const barData = (key: keyof RevenueCharts) =>
    (data[key] as Array<{ label: string; value: string; orders?: number }>).map((d) => ({
      name: d.label.length > 18 ? `${d.label.slice(0, 16)}…` : d.label,
      fullName: d.label,
      value: Number(d.value),
      orders: d.orders ?? 0,
    }));

  const growthData = data.revenue_growth.map((d) => ({
    name: d.label.slice(5),
    value: Number(d.value),
    orders: d.orders,
  }));

  const monthlyData = data.monthly_trend.map((m) => ({
    name: m.month,
    revenue: Number(m.revenue_inr),
    commission: Number(m.commission_inr),
    orders: m.orders,
  }));

  return (
    <AdminPanel
      title="Revenue trends"
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
          {tab === 'revenue' && (
            <BarChart data={barData('revenue_by_laundry')} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => formatInr(Number(v))}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          )}
          {tab === 'orders' && (
            <BarChart data={barData('orders_by_laundry')} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="orders" fill="hsl(var(--chart-2, var(--primary)))" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          )}
          {tab === 'commission' && (
            <BarChart data={barData('commission_by_laundry')} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => formatInr(Number(v))}
              />
              <Bar dataKey="value" fill="hsl(var(--chart-3, var(--primary)))" radius={[4, 4, 0, 0]} name="Commission" />
            </BarChart>
          )}
          {tab === 'growth' && (
            <AreaChart data={growthData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => formatInr(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="url(#revGrowth)"
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          )}
          {tab === 'monthly' && (
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v, name) =>
                  name === 'orders' ? v : formatInr(Number(v))
                }
              />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" dot={false} />
              <Line type="monotone" dataKey="commission" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Commission" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </AdminPanel>
  );
}
