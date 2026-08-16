import { buildBreadcrumbs } from '@/lib/navigation/breadcrumbs';
import { filterSearchItems, getSearchIndex } from '@/lib/navigation/search-index';

describe('Orders Hub nav aliases in chrome', () => {
  it('breadcrumbs map legacy admin paths to Orders', () => {
    expect(buildBreadcrumbs('/admin/customer-desk', 'admin')).toEqual([
      { label: 'Dashboard', href: '/admin' },
      { label: 'Orders' },
    ]);
    expect(buildBreadcrumbs('/admin/booking-requests', 'admin')[1]?.label).toBe('Orders');
    expect(buildBreadcrumbs('/admin/customers', 'admin')[1]?.label).toBe('Orders');
  });

  it('breadcrumbs map legacy partner paths onto split Customers / Orders nav', () => {
    expect(buildBreadcrumbs('/partner/customer-desk', 'partner')[1]?.label).toBe('Orders');
    expect(buildBreadcrumbs('/partner/booking-requests', 'partner')[1]?.label).toBe('Orders');
    expect(buildBreadcrumbs('/partner/customers', 'partner')[1]?.label).toBe('Customers');
  });

  it('search still finds old labels and routes them into hub tabs', () => {
    const admin = getSearchIndex('admin');
    const desk = filterSearchItems(admin, 'Customer Desk').find((i) => i.label === 'Customer Desk');
    expect(desk?.href).toBe('/admin/orders?tab=desk');

    const requests = filterSearchItems(admin, 'Booking requests').find(
      (i) => i.label === 'Booking requests',
    );
    expect(requests?.href).toBe('/admin/orders?tab=requests');

    const partner = getSearchIndex('partner');
    const customers = filterSearchItems(partner, 'Customers').find(
      (i) => i.href === '/partner/orders?workspace=customers',
    );
    expect(customers?.href).toBe('/partner/orders?workspace=customers');
  });
});
