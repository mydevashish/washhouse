'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

type KpiSparklineProps = {
  data: number[];
  positive?: boolean;
  className?: string;
};

export function KpiSparkline({ data, positive = true, className }: KpiSparklineProps) {
  const points = data.length > 0 ? data : [0, 0];
  const chartData = points.map((v, i) => ({ i, v }));
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const gradientId = `spark-${positive ? 'up' : 'down'}`;

  return (
    <div className={className} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
