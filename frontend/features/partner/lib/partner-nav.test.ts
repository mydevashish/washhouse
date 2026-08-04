import {
  PARTNER_NAV_SECTIONS,
  PARTNER_ORDERS_HUB_ALIASES,
  PARTNER_ORDERS_HUB_HREF,
  getPartnerPageTitle,
  isPartnerNavActive,
  partnerNavBadgeKeys,
  resolvePartnerNavPathname,
  stripNavQuery,
} from '@/features/partner/lib/partner-nav';

describe('partner Orders Hub hard-merge nav', () => {
  const operations = PARTNER_NAV_SECTIONS.find((s) => s.id === 'operations');

  it('keeps floor workflows and a single Orders item', () => {
    expect(operations?.items.map((i) => i.label)).toEqual([
      'Operations center',
      'New Order',
      'Orders',
      'Walk-in orders',
      'Pickup requests',
      'Deliveries',
    ]);
    expect(operations?.items.some((i) => i.label === 'Customer Desk')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Booking requests')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Customer insights')).toBe(false);
  });

  it('sums orders + bookingRequests badges on Orders', () => {
    const orders = operations?.items.find((i) => i.href === PARTNER_ORDERS_HUB_HREF);
    expect(partnerNavBadgeKeys(orders!)).toEqual(['orders', 'bookingRequests']);
  });

  it('strips ?tab= query for matching', () => {
    expect(stripNavQuery('/partner/orders?tab=directory')).toBe('/partner/orders');
  });

  it('resolves legacy paths to Orders Hub', () => {
    for (const alias of PARTNER_ORDERS_HUB_ALIASES) {
      expect(resolvePartnerNavPathname(alias)).toBe(PARTNER_ORDERS_HUB_HREF);
    }
  });

  it('highlights Orders for ?tab=* and legacy deep links', () => {
    expect(isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/orders?tab=desk', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/customer-desk', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/booking-requests', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/customers', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/customer-desk', '/partner/walk-in-orders')).toBe(false);
  });

  it('titles New Order and Orders detail correctly', () => {
    expect(getPartnerPageTitle('/partner/new-order')).toBe('New Order');
    expect(getPartnerPageTitle('/partner/orders')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/orders/11111111-1111-4111-8111-111111111111')).toBe(
      'Orders',
    );
  });

  it('titles legacy ops pages as Orders', () => {
    expect(getPartnerPageTitle('/partner/customer-desk')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/booking-requests')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/customers')).toBe('Orders');
  });
});
