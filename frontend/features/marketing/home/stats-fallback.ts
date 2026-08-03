import type { LucideIcon } from 'lucide-react';
import { MapPin, MapPinned, Shirt, Star, Users } from 'lucide-react';

import type { MarketingPublicStats } from '@/lib/api/marketing';
import { PRELAUNCH_STATS, PRELAUNCH_STAT_VALUE, resolveStatValue } from '@/lib/prelaunch-stats';

export type MarketingStat = {
  id: string;
  value: string;
  label: string;
  icon: LucideIcon;
};

/** Used only when `PRELAUNCH_STATS` is false and the API errors. */
export const MARKETING_STATS_FALLBACK_API: MarketingPublicStats = {
  happy_customers: 0,
  cities_covered: 0,
  pickup_points: 0,
  garments_cleaned: 0,
  customer_satisfaction_percent: null,
};

function formatCountStat(value: number): string {
  return `${value.toLocaleString('en-IN')}+`;
}

export function mapMarketingStatsToDisplay(stats: MarketingPublicStats): MarketingStat[] {
  const items: MarketingStat[] = [
    {
      id: 'happy-customers',
      value: resolveStatValue(formatCountStat(stats.happy_customers)),
      label: 'Happy Customers',
      icon: Users,
    },
    {
      id: 'cities-covered',
      value: resolveStatValue(formatCountStat(stats.cities_covered)),
      label: 'Cities Covered',
      icon: MapPin,
    },
    {
      id: 'pickup-points',
      value: resolveStatValue(formatCountStat(stats.pickup_points)),
      label: 'Pickup Points',
      icon: MapPinned,
    },
    {
      id: 'garments-cleaned',
      value: resolveStatValue(formatCountStat(stats.garments_cleaned)),
      label: 'Garments Cleaned',
      icon: Shirt,
    },
  ];

  if (PRELAUNCH_STATS) {
    items.push({
      id: 'customer-satisfaction',
      value: PRELAUNCH_STAT_VALUE,
      label: 'Customer Satisfaction',
      icon: Star,
    });
  } else if (stats.customer_satisfaction_percent != null) {
    items.push({
      id: 'customer-satisfaction',
      value: `${stats.customer_satisfaction_percent}%`,
      label: 'Customer Satisfaction',
      icon: Star,
    });
  } else if (stats.avg_review_rating != null) {
    items.push({
      id: 'avg-review-rating',
      value: stats.avg_review_rating.toFixed(1),
      label: 'Average Review Rating',
      icon: Star,
    });
  }

  return items;
}

export const MARKETING_STATS_FALLBACK = mapMarketingStatsToDisplay(MARKETING_STATS_FALLBACK_API);
