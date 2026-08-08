import {
  PARTNER_NAV_SECTIONS,
  PARTNER_ORDERS_HUB_ALIASES,
  PARTNER_ORDERS_HUB_HREF,
  PARTNER_PEOPLE_CUSTOMERS_HREF,
  getPartnerPageTitle,
  isPartnerNavActive,
  partnerNavBadgeKeys,
  resolvePartnerNavPathname,
  stripNavQuery,
} from '@/features/partner/lib/partner-nav';

describe('partner Owner Command Center nav (P1)', () => {
  const operations = PARTNER_NAV_SECTIONS.find((s) => s.id === 'operations');
  const logistics = PARTNER_NAV_SECTIONS.find((s) => s.id === 'logistics');
  const people = PARTNER_NAV_SECTIONS.find((s) => s.id === 'people');
  const money = PARTNER_NAV_SECTIONS.find((s) => s.id === 'money');

  it('groups into owner pillars with slim operations', () => {
    expect(PARTNER_NAV_SECTIONS.map((s) => s.id)).toEqual([
      'today',
      'operations',
      'logistics',
      'people',
      'money',
      'shop',
      'system',
    ]);
    expect(operations?.items.map((i) => i.label)).toEqual([
      'New Order',
      'Orders',
      'Walk-in orders',
    ]);
    expect(logistics?.items.map((i) => i.label)).toEqual(['Logistics']);
    expect(logistics?.items[0]?.href).toBe('/partner/logistics');
    expect(partnerNavBadgeKeys(logistics!.items[0]!)).toEqual(['pickups']);
    expect(people?.items.map((i) => i.label)).toEqual(['Customers', 'Staff']);
    expect(money?.items.map((i) => i.label)).toEqual(['Revenue', 'Settlements', 'Reports']);
    expect(operations?.items.some((i) => i.label === 'Customer Desk')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Booking requests')).toBe(false);
  });

  it('sums orders + bookingRequests badges on Orders', () => {
    const orders = operations?.items.find((i) => i.href === PARTNER_ORDERS_HUB_HREF);
    expect(partnerNavBadgeKeys(orders!)).toEqual(['orders', 'bookingRequests']);
  });

  it('maps legacy pickups/deliveries onto Logistics hub', () => {
    expect(resolvePartnerNavPathname('/partner/pickups')).toBe('/partner/logistics');
    expect(resolvePartnerNavPathname('/partner/deliveries')).toBe('/partner/logistics');
    expect(isPartnerNavActive('/partner/pickups', '/partner/logistics')).toBe(true);
    expect(getPartnerPageTitle('/partner/pickups')).toBe('Logistics');
  });

  it('strips ?tab= query for matching', () => {
    expect(stripNavQuery('/partner/orders?tab=directory')).toBe('/partner/orders');
  });

  it('resolves legacy desk/BR paths to Orders Hub (not customers)', () => {
    for (const alias of PARTNER_ORDERS_HUB_ALIASES) {
      expect(resolvePartnerNavPathname(alias)).toBe(PARTNER_ORDERS_HUB_HREF);
    }
    expect(resolvePartnerNavPathname('/partner/customers')).toBe('/partner/customers');
  });

  it('highlights Orders for desk/requests and legacy deep links', () => {
    expect(isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF, { tab: 'desk' })).toBe(
      true,
    );
    expect(isPartnerNavActive('/partner/customer-desk', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/booking-requests', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/customer-desk', '/partner/walk-in-orders')).toBe(false);
  });

  it('highlights People › Customers on directory tab and legacy customers path', () => {
    expect(
      isPartnerNavActive('/partner/orders', PARTNER_PEOPLE_CUSTOMERS_HREF, { tab: 'directory' }),
    ).toBe(true);
    expect(isPartnerNavActive('/partner/customers', PARTNER_PEOPLE_CUSTOMERS_HREF)).toBe(true);
    expect(
      isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF, { tab: 'directory' }),
    ).toBe(false);
  });

  it('titles New Order, Orders detail, and Customers correctly', () => {
    expect(getPartnerPageTitle('/partner/new-order')).toBe('New Order');
    expect(getPartnerPageTitle('/partner')).toBe('Today');
    expect(getPartnerPageTitle('/partner/orders')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/orders/11111111-1111-4111-8111-111111111111')).toBe(
      'Orders',
    );
    expect(getPartnerPageTitle('/partner/orders', 'directory')).toBe('Customers');
    expect(getPartnerPageTitle('/partner/customers')).toBe('Customers');
  });

  it('titles legacy desk/BR pages as Orders', () => {
    expect(getPartnerPageTitle('/partner/customer-desk')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/booking-requests')).toBe('Orders');
  });
});
