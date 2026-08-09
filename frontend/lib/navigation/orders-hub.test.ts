import {
  buildOrdersHubPath,
  buildOrdersHubSearchParams,
  parseOrdersHubTab,
  parsePartnerOrdersHubTab,
} from '@/lib/navigation/orders-hub';

describe('orders-hub navigation helpers', () => {
  it('parses known tabs and falls back to orders', () => {
    expect(parseOrdersHubTab('desk')).toBe('desk');
    expect(parseOrdersHubTab('requests')).toBe('requests');
    expect(parseOrdersHubTab('directory')).toBe('directory');
    expect(parseOrdersHubTab('orders')).toBe('orders');
    expect(parseOrdersHubTab('place-order')).toBe('orders');
    expect(parseOrdersHubTab(null)).toBe('orders');
  });

  it('builds hub paths and overwrites legacy tab while preserving extras', () => {
    expect(buildOrdersHubPath('/admin/orders', 'desk')).toBe('/admin/orders?tab=desk');
    expect(
      buildOrdersHubPath('/admin/orders', 'desk', {
        phone: '+919876543210',
        tab: 'orders',
        user_id: 'u-1',
      }),
    ).toBe('/admin/orders?phone=%2B919876543210&user_id=u-1&tab=desk');

    expect(
      buildOrdersHubPath('/partner/orders', 'requests', {
        phone: '+919876543210',
        status: 'assigned',
      }),
    ).toBe('/partner/orders?phone=%2B919876543210&status=assigned&tab=requests');

    expect(buildOrdersHubPath('/admin/orders', 'orders')).toBe('/admin/orders');
    expect(buildOrdersHubPath('/partner/orders', 'directory', new URLSearchParams('foo=1'))).toBe(
      '/partner/orders?foo=1&tab=directory',
    );
  });

  it('builds partner create tab path', () => {
    expect(buildOrdersHubPath('/partner/orders', 'create')).toBe('/partner/orders?tab=create');
  });

  it('parses partner create tab', () => {
    expect(parsePartnerOrdersHubTab('create')).toBe('create');
    expect(parsePartnerOrdersHubTab('desk')).toBe('desk');
  });

  it('omits tab query for the default orders tab', () => {
    const params = buildOrdersHubSearchParams('orders', { phone: '+919800000000', tab: 'desk' });
    expect(params.get('tab')).toBeNull();
    expect(params.get('phone')).toBe('+919800000000');
  });
});
