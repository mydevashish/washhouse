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
import type { PlatformPartnerCharts } from '@/services/platform-partner-dashboard';
import { cn } from '@/lib/utils';

type TabId = 'revenue' | 'orders' | 'customers' | 'laundries';

const TABS: { id: TabId; label: string }[] = [
  { id: 'revenue', label: 'Revenue trend' },
  { id: 'orders', label: 'Orders trend' },
  { id: 'customers', label: 'Customer growth' },
  { id: 'laundries', label: 'Laundry growth' },
];

type Props = { data: PlatformPartnerCharts | undefined; loading?: boolean };

function formatDayLabel(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function PlatformPartnerCharts({ data, loading }: Props) {
  const [tab, setTab] = useState<TabId>('revenue');

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />;
  }
  if (!data) return null;

  const revenueData = data.revenue_trend.map((p) => ({ name: formatDayLabel(p.date), value: p.value }));
  const ordersData = data.orders_trend.map((p) => ({ name: formatDayLabel(p.date), value: p.value }));
  const customerData = data.customer_growth.map((p) => ({ name: p.month, count: p.count }));
  const laundryData = data.laundry_growth.map((p) => ({ name: p.month, count: p.count }));

  return (
    <AdminPanel
      title="Trends"
      description="Read-only marketplace analytics"
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
            <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatInr(Number(v))} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          )}
          {tab === 'orders' && (
            <LineChart data={ordersData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          )}
          {(tab === 'customers' || tab === 'laundries') && (
            <BarChart data={tab === 'customers' ? customerData : laundryData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </AdminPanel>
  );
}
