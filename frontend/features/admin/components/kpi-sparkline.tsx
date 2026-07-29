'use client';

type KpiSparklineProps = {
  data: number[];
  positive?: boolean;
  className?: string;
};

/** Lightweight SVG sparkline — avoids Recharts focusables inside aria-hidden KPI cards. */
export function KpiSparkline({ data, positive = true, className }: KpiSparklineProps) {
  const points = data.length > 1 ? data : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 64;
  const h = 32;
  const pad = 2;
  const path = points
    .map((v, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke = positive ? 'var(--success)' : 'var(--danger)';

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      focusable="false"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
