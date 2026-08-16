import { resolvePartnerReportsDateRange } from '@/features/partner/lib/partner-reports-period';

describe('partner-reports-period', () => {
  const now = new Date('2026-08-15T12:00:00+05:30');

  it('resolves week/month/year windows in IST', () => {
    expect(resolvePartnerReportsDateRange('week', undefined, undefined, now)).toMatchObject({
      date_from: '2026-08-10',
      date_to: '2026-08-16',
    });
    expect(resolvePartnerReportsDateRange('month', undefined, undefined, now)).toMatchObject({
      date_from: '2026-08-01',
      date_to: '2026-08-31',
    });
    expect(resolvePartnerReportsDateRange('year', undefined, undefined, now)).toMatchObject({
      date_from: '2026-01-01',
      date_to: '2026-12-31',
    });
  });

  it('builds slug for custom range filenames', () => {
    const range = resolvePartnerReportsDateRange('custom', '2026-08-01', '2026-08-15', now);
    expect(range.slug).toBe('2026-08-01_2026-08-15');
  });
});
