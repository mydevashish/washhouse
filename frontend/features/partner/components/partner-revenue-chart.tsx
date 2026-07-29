'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatInr } from '@/features/discover/detail/order-pricing';

type ChartPoint = { label: string; revenue: number };

export function PartnerRevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(v) => formatInr(Number(v))} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary)/0.15)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
