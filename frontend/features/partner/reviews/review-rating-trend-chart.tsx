'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PartnerPanel } from '@/features/partner/components/partner-panel';
import type { ReviewAnalytics } from '@/services/review-management';

type Props = { data: ReviewAnalytics | undefined; loading?: boolean };

function formatDayLabel(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ReviewRatingTrendChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted/50 ring-1 ring-border/40" />;
  }
  if (!data?.rating_trend.length) {
    return (
      <PartnerPanel title="Rating trend" bodyClassName="px-4 py-6">
        <p className="text-sm text-muted-foreground">Not enough review data for a trend yet.</p>
      </PartnerPanel>
    );
  }

  const chartData = data.rating_trend
    .filter((p) => p.review_count > 0 || p.avg_rating > 0)
    .map((p) => ({
      name: formatDayLabel(p.date),
      rating: p.avg_rating,
      reviews: p.review_count,
    }));

  const displayData = chartData.length > 0 ? chartData : data.rating_trend.slice(-14).map((p) => ({
    name: formatDayLabel(p.date),
    rating: p.avg_rating,
    reviews: p.review_count,
  }));

  return (
    <PartnerPanel title="Rating trend" description="30-day average rating" bodyClassName="p-4 pt-3">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value, name) =>
                name === 'rating' ? [`${Number(value).toFixed(1)} ★`, 'Avg rating'] : [value, 'Reviews']
              }
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="rating"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </PartnerPanel>
  );
}
