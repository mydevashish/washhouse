import type { LucideIcon } from 'lucide-react';
import { MapPin, MapPinned, Shirt, Star, Users } from 'lucide-react';

import type { MarketingPublicStats } from '@/lib/api/marketing';

export type MarketingStat = {
  id: string;
  value: string;
  label: string;
  icon: LucideIcon;
};

export const MARKETING_STATS_FALLBACK_API: MarketingPublicStats = {
  happy_customers: 100,
  cities_covered: 1,
  pickup_points: 1,
  garments_cleaned: 500,
  customer_satisfaction_percent: 98,
};

function formatCountStat(value: number): string {
  return `${value.toLocaleString('en-IN')}+`;
}

export function mapMarketingStatsToDisplay(stats: MarketingPublicStats): MarketingStat[] {
  const items: MarketingStat[] = [
    {
      id: 'happy-customers',
      // value: formatCountStat(stats.happy_customers),
      value: '100+',
      label: 'Happy Customers',
      icon: Users,
    },
    {
      id: 'cities-covered',
      value: '1+',
      label: 'Cities Covered',
      icon: MapPin,
    },
    {
      id: 'pickup-points',
      value: '1+',
      label: 'Pickup Points',
      icon: MapPinned,
    },
    {
      id: 'garments-cleaned',
      value: '500+',
      label: 'Garments Cleaned',
      icon: Shirt,
    },
    {
      id: 'customer-satisfaction',
      value: '98%',
      label: 'Customer Satisfaction',
      icon: Star,
    }
  ];

  // if (stats.customer_satisfaction_percent != null) {
  //   items.push({
  //     id: 'customer-satisfaction',
  //     value: `${stats.customer_satisfaction_percent}%`,
  //     label: 'Customer Satisfaction',
  //     icon: Star,
  //   });
  // } else if (stats.avg_review_rating != null) {
  //   items.push({
  //     id: 'avg-review-rating',
  //     value: stats.avg_review_rating.toFixed(1),
  //     label: 'Average Review Rating',
  //     icon: Star,
  //   });
  // }

  return items;
}

export const MARKETING_STATS_FALLBACK = mapMarketingStatsToDisplay(MARKETING_STATS_FALLBACK_API);
