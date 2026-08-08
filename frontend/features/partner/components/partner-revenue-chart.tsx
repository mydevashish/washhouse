'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatInr } from '@/features/discover/detail/order-pricing';

type ChartPoint = { label: string; revenue: number; net?: number };

export function PartnerRevenueChart({ data }: { data: ChartPoint[] }) {
  const showNet = data.some((d) => typeof d.net === 'number' && d.net > 0);
  return (
    <div className="h-48 w-full" role="img" aria-label="Gross and net revenue by period">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(v) => formatInr(Number(v))} />
          {showNet ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Gross"
            stroke="var(--primary)"
            fill="color-mix(in srgb, var(--primary) 18%, transparent)"
          />
          {showNet ? (
            <Area
              type="monotone"
              dataKey="net"
              name="Your net"
              stroke="var(--success)"
              fill="color-mix(in srgb, var(--success) 14%, transparent)"
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
