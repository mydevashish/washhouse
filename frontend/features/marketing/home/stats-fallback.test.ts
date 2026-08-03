import { mapMarketingStatsToDisplay } from '@/features/marketing/home/stats-fallback';
import type { MarketingPublicStats } from '@/lib/api/marketing';
import { PRELAUNCH_STAT_VALUE } from '@/lib/prelaunch-stats';

jest.mock('@/lib/prelaunch-stats', () => ({
  PRELAUNCH_STATS: true,
  PRELAUNCH_STAT_VALUE: 'Coming Soon',
  resolveStatValue: () => 'Coming Soon',
}));

const SAMPLE: MarketingPublicStats = {
  happy_customers: 5000,
  cities_covered: 12,
  pickup_points: 40,
  garments_cleaned: 250000,
  customer_satisfaction_percent: 96,
};

describe('mapMarketingStatsToDisplay (pre-launch)', () => {
  it('shows Coming Soon for every KPI label, not live counts', () => {
    const stats = mapMarketingStatsToDisplay(SAMPLE);
    expect(stats.length).toBeGreaterThanOrEqual(4);
    for (const stat of stats) {
      expect(stat.value).toBe(PRELAUNCH_STAT_VALUE);
    }
    expect(stats.map((s) => s.label)).toEqual(
      expect.arrayContaining([
        'Happy Customers',
        'Cities Covered',
        'Pickup Points',
        'Garments Cleaned',
        'Customer Satisfaction',
      ]),
    );
  });
});
