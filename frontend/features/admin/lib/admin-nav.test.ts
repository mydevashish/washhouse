import {
  ADMIN_NAV_SECTIONS,
  ADMIN_ORDERS_HUB_ALIASES,
  ADMIN_ORDERS_HUB_HREF,
  getAdminPageTitle,
  isAdminNavActive,
  resolveAdminNavPathname,
  stripNavQuery,
} from '@/features/admin/lib/admin-nav';

describe('admin Orders Hub hard-merge nav', () => {
  const operations = ADMIN_NAV_SECTIONS.find((s) => s.id === 'operations');

  it('keeps only Laundries + Orders in Operations', () => {
    expect(operations?.items.map((i) => i.label)).toEqual(['Laundries', 'Orders']);
    expect(operations?.items.map((i) => i.href)).toEqual(['/admin/laundries', ADMIN_ORDERS_HUB_HREF]);
  });

  it('moves bookingRequests badge onto Orders', () => {
    const orders = operations?.items.find((i) => i.href === ADMIN_ORDERS_HUB_HREF);
    expect(orders?.badgeKey).toBe('bookingRequests');
  });

  it('strips ?tab= query for matching', () => {
    expect(stripNavQuery('/admin/orders?tab=desk')).toBe('/admin/orders');
  });

  it('resolves legacy paths to Orders Hub', () => {
    for (const alias of ADMIN_ORDERS_HUB_ALIASES) {
      expect(resolveAdminNavPathname(alias)).toBe(ADMIN_ORDERS_HUB_HREF);
      expect(resolveAdminNavPathname(`${alias}/extra`)).toBe(ADMIN_ORDERS_HUB_HREF);
    }
  });

  it('highlights Orders for /admin/orders?tab=* and legacy deep links', () => {
    expect(isAdminNavActive('/admin/orders', ADMIN_ORDERS_HUB_HREF)).toBe(true);
    expect(isAdminNavActive('/admin/orders?tab=desk', ADMIN_ORDERS_HUB_HREF)).toBe(true);
    expect(isAdminNavActive('/admin/orders?tab=requests', '/admin/orders?tab=requests')).toBe(true);
    expect(isAdminNavActive('/admin/customer-desk', ADMIN_ORDERS_HUB_HREF)).toBe(true);
    expect(isAdminNavActive('/admin/booking-requests', ADMIN_ORDERS_HUB_HREF)).toBe(true);
    expect(isAdminNavActive('/admin/customers', ADMIN_ORDERS_HUB_HREF)).toBe(true);
    expect(isAdminNavActive('/admin/customer-desk', '/admin/laundries')).toBe(false);
  });

  it('titles legacy ops pages as Orders', () => {
    expect(getAdminPageTitle('/admin/orders')).toBe('Orders');
    expect(getAdminPageTitle('/admin/customer-desk')).toBe('Orders');
    expect(getAdminPageTitle('/admin/booking-requests')).toBe('Orders');
    expect(getAdminPageTitle('/admin/customers')).toBe('Orders');
  });
});
