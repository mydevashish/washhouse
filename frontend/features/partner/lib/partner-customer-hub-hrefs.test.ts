import {
  buildCustomerScopedOrdersHref,
  buildDeskPrefillHref,
  buildNewOrderHref,
} from '@/features/partner/customer-desk/phone';
import {
  PARTNER_RECENT_CUSTOMERS_KEY,
  rememberRecentCustomer,
  readRecentCustomersToday,
} from '@/features/partner/lib/partner-recent-customers';

describe('customer hub href builders (P4)', () => {
  it('builds walk-in and assisted new-order hrefs', () => {
    expect(buildNewOrderHref('+919876543210', 'Riya', 'walk_in')).toBe(
      '/partner/orders?tab=create&phone=%2B919876543210&name=Riya',
    );
    expect(buildNewOrderHref('+919876543210', null, 'assisted')).toBe(
      '/partner/orders?tab=create&phone=%2B919876543210&fulfillment=doorstep&mode=assisted',
    );
  });

  it('builds desk prefill href', () => {
    expect(buildDeskPrefillHref({ phone: '+919876543210' })).toBe(
      '/partner/orders?workspace=customers&phone=%2B919876543210',
    );
    expect(buildDeskPrefillHref({ user_id: 'u-42' })).toBe(
      '/partner/orders?workspace=customers&user_id=u-42',
    );
  });

  it('builds customer-scoped orders href', () => {
    expect(buildCustomerScopedOrdersHref('+919876543210', 'Riya')).toBe(
      '/partner/orders?phone=%2B919876543210&q=%2B919876543210&customer=Riya&workspace=orders',
    );
  });
});

describe('partner recent customers (localStorage)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('remembers phones for today and de-dupes', () => {
    const now = new Date('2026-08-08T10:00:00+05:30');
    rememberRecentCustomer({ phone: '+919876543210', name: 'Riya' }, now);
    rememberRecentCustomer({ phone: '9876543210', name: 'Riya Updated' }, now);
    rememberRecentCustomer({ phone: '+919111111111', name: 'Asha' }, now);

    const today = readRecentCustomersToday(now);
    expect(today).toHaveLength(2);
    expect(today[0]?.name).toBe('Asha');
    expect(today[1]?.name).toBe('Riya Updated');
    expect(window.localStorage.getItem(PARTNER_RECENT_CUSTOMERS_KEY)).toBeTruthy();
  });

  it('hides yesterday entries from the today strip', () => {
    const yesterday = new Date('2026-08-07T10:00:00+05:30');
    const today = new Date('2026-08-08T10:00:00+05:30');
    rememberRecentCustomer({ phone: '+919876543210', name: 'Old' }, yesterday);
    expect(readRecentCustomersToday(today)).toHaveLength(0);
  });
});
