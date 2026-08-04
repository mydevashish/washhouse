'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';
import type { PartnerOrder } from '@/services/partner';

const STATUS_BUCKETS = [
  'confirmed',
  'pickup_assigned',
  'picked_up',
  'washing',
  'ironing',
  'ready',
  'out_for_delivery',
  'delivered',
] as const;

type PartnerStatusOverviewChartProps = {
  orders: PartnerOrder[];
};

export function PartnerStatusOverviewChart({ orders }: PartnerStatusOverviewChartProps) {
  const counts = Object.fromEntries(STATUS_BUCKETS.map((s) => [s, 0])) as Record<string, number>;
  for (const o of orders) {
    if (o.status in counts) counts[o.status] = (counts[o.status] ?? 0) + 1;
  }

  const data = STATUS_BUCKETS.map((status) => ({
    status,
    label: getOrderStatusLabel(status).replace('Order ', ''),
    count: counts[status] ?? 0,
  })).filter((row) => row.count > 0 || ['confirmed', 'washing', 'ready', 'delivered'].includes(row.status));

  return (
    <PartnerPanel
      title="Order status overview"
      description="Active queue by stage"
      bodyClassName="p-4 pt-3"
    >
      <div className="h-52 w-full" role="img" aria-label="Order counts by status">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PartnerPanel>
  );
}
