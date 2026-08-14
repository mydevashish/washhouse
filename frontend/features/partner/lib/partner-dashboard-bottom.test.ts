import {
  formatDashboardAvgDeliveryHours,
  formatDashboardRatingDisplay,
  formatDashboardReviewCountSubtitle,
  mapPartnerDashboardBottomStats,
} from '@/features/partner/lib/partner-dashboard-bottom';

describe('formatDashboardAvgDeliveryHours', () => {
  it('converts minutes to hours or em dash', () => {
    expect(formatDashboardAvgDeliveryHours(144)).toBe('2.4 hrs');
    expect(formatDashboardAvgDeliveryHours(null)).toBe('—');
    expect(formatDashboardAvgDeliveryHours(0)).toBe('—');
  });
});

describe('formatDashboardRatingDisplay', () => {
  it('formats rating or em dash when missing', () => {
    expect(formatDashboardRatingDisplay('4.70')).toBe('4.7 / 5');
    expect(formatDashboardRatingDisplay('0.00')).toBe('—');
  });
});

describe('mapPartnerDashboardBottomStats', () => {
  it('maps six tiles without fake growth deltas', () => {
    const rows = mapPartnerDashboardBottomStats({
      customers_total: 1256,
      customers_new_week: 85,
      customers_repeat: 1171,
      avg_order_value_inr: '476.00',
      avg_delivery_minutes: 144,
      avg_rating: '4.70',
      review_count: 2191,
    });

    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({ label: 'Total Customers', value: '1,256', subtitle: null });
    expect(rows[1]).toMatchObject({ label: 'New Customers', subtitle: 'This week' });
    expect(rows[4]?.value).toBe('2.4 hrs');
    expect(rows[5]).toMatchObject({
      label: 'Customer Rating',
      value: '4.7 / 5',
      subtitle: formatDashboardReviewCountSubtitle(2191),
    });
  });
});
