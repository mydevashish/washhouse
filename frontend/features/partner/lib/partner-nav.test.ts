import {
  PARTNER_CUSTOMERS_ORDERS_LABEL,
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

describe('partner Customers & Orders Hub nav (P1)', () => {
  const operations = PARTNER_NAV_SECTIONS.find((s) => s.id === 'operations');
  const logistics = PARTNER_NAV_SECTIONS.find((s) => s.id === 'logistics');
  const people = PARTNER_NAV_SECTIONS.find((s) => s.id === 'people');
  const money = PARTNER_NAV_SECTIONS.find((s) => s.id === 'money');

  it('groups into separate Customers and Orders sidebar items', () => {
    expect(PARTNER_NAV_SECTIONS.map((s) => s.id)).toEqual([
      'today',
      'operations',
      'logistics',
      'people',
      'money',
      'shop',
      'system',
    ]);
    expect(operations?.items.map((i) => i.label)).toEqual(['Customers', 'Orders']);
    expect(operations?.items.map((i) => i.href)).toEqual(['/partner/customers', '/partner/orders']);
    expect(operations?.items.some((i) => i.label === 'New order')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Walk-in orders')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Customer Desk')).toBe(false);
    expect(operations?.items.some((i) => i.label === 'Booking requests')).toBe(false);
    expect(logistics?.items.map((i) => i.label)).toEqual(['Logistics']);
    expect(logistics?.items[0]?.href).toBe('/partner/logistics');
    expect(partnerNavBadgeKeys(logistics!.items[0]!)).toEqual(['pickups']);
    expect(people?.items.map((i) => i.label)).toEqual(['Staff']);
    expect(people?.items.some((i) => i.label === 'Customers')).toBe(false);
    expect(money?.items.map((i) => i.label)).toEqual(['Revenue', 'Settlements', 'Reports']);
  });

  it('keeps Customers and Orders as distinct entries with their own routes', () => {
    const customers = operations?.items.find((i) => i.href === '/partner/customers');
    const orders = operations?.items.find((i) => i.href === '/partner/orders');
    expect(customers?.label).toBe('Customers');
    expect(orders?.label).toBe('Orders');
    expect(partnerNavBadgeKeys(customers!)).toEqual([]);
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

  it('resolves desk/BR/customers/intake/print aliases onto the hub', () => {
    for (const alias of PARTNER_ORDERS_HUB_ALIASES) {
      expect(resolvePartnerNavPathname(alias)).toBe(PARTNER_ORDERS_HUB_HREF);
    }
    expect(resolvePartnerNavPathname('/partner/customers')).toBe(PARTNER_ORDERS_HUB_HREF);
    expect(resolvePartnerNavPathname('/partner/floor/print/abc/tags')).toBe(PARTNER_ORDERS_HUB_HREF);
    expect(resolvePartnerNavPathname('/partner/floor/new')).toBe(PARTNER_ORDERS_HUB_HREF);
    expect(resolvePartnerNavPathname('/partner/new-order')).toBe(PARTNER_ORDERS_HUB_HREF);
    expect(resolvePartnerNavPathname('/partner/services')).toBe('/partner/services');
  });

  it('highlights Customers & Orders for hub tabs, legacy CRM, intake, and print', () => {
    expect(isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF, { tab: 'desk' })).toBe(
      true,
    );
    expect(
      isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF, { tab: 'directory' }),
    ).toBe(true);
    expect(isPartnerNavActive('/partner/customer-desk', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/booking-requests', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive(PARTNER_PEOPLE_CUSTOMERS_HREF, PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/new-order', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(
      isPartnerNavActive('/partner/orders', PARTNER_ORDERS_HUB_HREF, { tab: 'create' }),
    ).toBe(true);
    expect(isPartnerNavActive('/partner/walk-in-orders', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/floor/new', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/floor/print', PARTNER_ORDERS_HUB_HREF)).toBe(true);
    expect(isPartnerNavActive('/partner/customer-desk', '/partner/staff')).toBe(false);
  });

  it('titles hub, aliases, and Dashboard correctly', () => {
    expect(getPartnerPageTitle('/partner')).toBe('Dashboard');
    expect(getPartnerPageTitle('/partner/orders')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/orders/11111111-1111-4111-8111-111111111111')).toBe(
      'Orders',
    );
    expect(getPartnerPageTitle('/partner/orders', 'directory')).toBe('Orders');
    expect(getPartnerPageTitle('/partner/customers')).toBe('Customers');
    expect(getPartnerPageTitle('/partner/new-order')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/orders', 'create')).toBe('New order');
    expect(getPartnerPageTitle('/partner/walk-in-orders')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/floor/print')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/customer-desk')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/booking-requests')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/coupons')).toBe(PARTNER_CUSTOMERS_ORDERS_LABEL);
    expect(getPartnerPageTitle('/partner/services')).toBe('Service catalog');
  });
});
