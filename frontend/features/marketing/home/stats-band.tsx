'use client';

import {
  GLASS_ON_BRAND,
  MARKETING_CONTAINER,
  MARKETING_STATS_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { useMarketingStats } from '@/features/marketing/hooks/use-marketing';
import type { MarketingStat } from '@/features/marketing/home/stats-fallback';
import { MARKETING_STATS_FALLBACK } from '@/features/marketing/home/stats-fallback';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { cn } from '@/lib/utils';

export type { MarketingStat } from '@/features/marketing/home/stats-fallback';
export { MARKETING_STATS_FALLBACK };

const STATS_SECTION_LABEL = `${WASHHOUSE_BRAND_NAME} by the numbers`;

const STATS_CARD_CLASS = cn(
  'flex h-full flex-col items-center rounded-2xl px-3 py-5 text-center sm:px-4 sm:py-6',
  GLASS_ON_BRAND,
);

function StatsGrid({
  stats,
  isLoading = false,
}: {
  stats: MarketingStat[];
  isLoading?: boolean;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4',
        'md:grid-cols-3',
        'lg:grid-cols-5',
      )}
      aria-busy={isLoading}
      aria-live={isLoading ? 'polite' : undefined}
    >
      {stats.map(({ id, value, label, icon: Icon }) => (
        <li key={id}>
          <div className={STATS_CARD_CLASS}>
            <div
              className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-on-hero"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight text-on-hero sm:text-2xl lg:text-3xl">
              {value}
            </p>
            <p className="mt-1.5 text-xs font-medium leading-snug text-on-hero-muted sm:text-sm">
              {label}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type StatsBandProps = {
  stats?: MarketingStat[];
};

export function StatsBand({ stats: statsOverride }: StatsBandProps) {
  const { stats: fetchedStats, isLoading } = useMarketingStats();
  const stats = statsOverride ?? fetchedStats;

  if (stats.length === 0) return null;

  return (
    <section
      aria-labelledby="marketing-stats-title"
      className={cn(
        'mt-2 w-full bg-gradient-to-r from-brand-900 via-brand-600 to-brand-900 sm:mt-4',
        MARKETING_STATS_SECTION_PY,
      )}
    >
      <div className={MARKETING_CONTAINER}>
        <h2 id="marketing-stats-title" className="sr-only">
          {STATS_SECTION_LABEL}
        </h2>
        <StatsGrid stats={stats} isLoading={!statsOverride && isLoading} />
      </div>
    </section>
  );
}
