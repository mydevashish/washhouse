import {
  partnerDashboardRecentOrdersListParams,
  partnerDashboardRecentOrdersViewAllHref,
} from './partner-dashboard-recent-orders-filter';

describe('partnerDashboardRecentOrdersListParams', () => {
  it('maps lenses to existing list API filters', () => {
    expect(partnerDashboardRecentOrdersListParams('all')).toEqual({ bucket: 'all' });
    expect(partnerDashboardRecentOrdersListParams('needs_action')).toEqual({ bucket: 'action' });
    expect(partnerDashboardRecentOrdersListParams('processing')).toEqual({ bucket: 'active' });
    expect(partnerDashboardRecentOrdersListParams('ready')).toEqual({
      bucket: 'all',
      status: 'ready',
    });
    expect(partnerDashboardRecentOrdersListParams('delivered')).toEqual({
      bucket: 'all',
      status: 'delivered',
    });
    expect(partnerDashboardRecentOrdersListParams('cancelled')).toEqual({
      bucket: 'all',
      status: 'cancelled',
    });
  });
});

describe('partnerDashboardRecentOrdersViewAllHref', () => {
  it('deep-links hub with chip or status params and orders workspace', () => {
    expect(partnerDashboardRecentOrdersViewAllHref('needs_action')).toBe(
      '/partner/orders?chip=needs_action&workspace=orders',
    );
    expect(partnerDashboardRecentOrdersViewAllHref('ready')).toBe(
      '/partner/orders?status=ready&workspace=orders',
    );
    expect(partnerDashboardRecentOrdersViewAllHref('all')).toBe('/partner/orders');
  });
});
