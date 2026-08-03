import { mapMarketingStatsToDisplay } from '@/features/marketing/home/stats-fallback';
import type { MarketingPublicStats } from '@/lib/api/marketing';

jest.mock('@/lib/prelaunch-stats', () => ({
  PRELAUNCH_STATS: false,
  PRELAUNCH_STAT_VALUE: 'Coming Soon',
  resolveStatValue: (liveValue: string) => liveValue,
}));

const SAMPLE: MarketingPublicStats = {
  happy_customers: 5000,
  cities_covered: 12,
  pickup_points: 40,
  garments_cleaned: 250000,
  customer_satisfaction_percent: 96,
};

describe('mapMarketingStatsToDisplay (live)', () => {
  it('formats API counts when pre-launch is off', () => {
    const stats = mapMarketingStatsToDisplay(SAMPLE);
    expect(stats.find((s) => s.id === 'happy-customers')?.value).toBe('5,000+');
    expect(stats.find((s) => s.id === 'customer-satisfaction')?.value).toBe('96%');
  });
});
