import {
  buildCustomerCrmInsights,
  countNewCustomersThisWeek,
  customerInitials,
  customerSoftTag,
  filterCustomerRows,
  normalizeIndiaPhone,
  newOrderPrefillHref,
  telHref,
  whatsappHref,
} from '@/features/partner/lib/owner-customer-crm';
import type { CustomerInsightRow, CustomerInsightsDashboard } from '@/services/customer-insights';

function row(partial: Partial<CustomerInsightRow> & Pick<CustomerInsightRow, 'user_id' | 'name'>): CustomerInsightRow {
  return {
    lifetime_spend_inr: '1000',
    order_count: 2,
    avg_order_value_inr: '500',
    last_order_at: null,
    first_order_at: null,
    retention_score: 50,
    segment: 'active',
    segment_label: 'Active',
    is_high_risk: false,
    dispute_count: 0,
    risk_label: 'Low',
    phone: null,
    ...partial,
  };
}

describe('owner-customer-crm', () => {
  it('maps segments to soft tags with text labels', () => {
    expect(customerSoftTag('new').label).toBe('New');
    expect(customerSoftTag('vip').label).toBe('Regular');
    expect(customerSoftTag('active').label).toBe('Regular');
    expect(customerSoftTag('at_risk').label).toBe('At risk');
    expect(customerSoftTag('inactive').label).toBe('At risk');
    expect(customerSoftTag('new').description).toMatch(/New customer/i);
  });

  it('builds initials from names', () => {
    expect(customerInitials('Priya Sharma')).toBe('PS');
    expect(customerInitials('Asha')).toBe('AS');
    expect(customerInitials('  ')).toBe('?');
  });

  it('normalizes India phones for tel and WhatsApp', () => {
    expect(normalizeIndiaPhone('9876543210')).toBe('919876543210');
    expect(normalizeIndiaPhone('+91 98765 43210')).toBe('919876543210');
    expect(normalizeIndiaPhone('09876543210')).toBe('919876543210');
    expect(whatsappHref('9876543210')).toBe('https://wa.me/919876543210');
    expect(telHref('9876543210')).toBe('tel:+919876543210');
    expect(whatsappHref(null)).toBeNull();
  });

  it('builds new-order prefill href', () => {
    expect(newOrderPrefillHref({ name: 'Riya', phone: '+919876543210' })).toBe(
      '/partner/new-order?mode=walk_in&phone=%2B919876543210&name=Riya',
    );
  });

  it('counts new customers this week from first_order_at', () => {
    const now = new Date('2026-08-08T12:00:00Z');
    const rows = [
      row({ user_id: '1', name: 'A', first_order_at: '2026-08-06T10:00:00Z' }),
      row({ user_id: '2', name: 'B', first_order_at: '2026-07-01T10:00:00Z' }),
      row({ user_id: '3', name: 'C', first_order_at: null }),
    ];
    expect(countNewCustomersThisWeek(rows, now)).toBe(1);
  });

  it('builds insights strip metrics', () => {
    const dashboard: CustomerInsightsDashboard = {
      total_customers: 10,
      segments: { new: 2, active: 5, vip: 1, at_risk: 1, inactive: 1 },
      lists: { top: 5, repeat: 4, vip: 1, inactive: 1, high_risk: 0 },
      avg_retention_score: '60',
      avg_lifetime_spend_inr: '500',
      avg_order_value_inr: '200',
      new_this_week: 3,
    };
    const top = [row({ user_id: '1', name: 'A', lifetime_spend_inr: '9000' })];
    const insights = buildCustomerCrmInsights(dashboard, top);
    expect(insights.newThisWeek).toBe(3);
    expect(insights.repeatRatePct).toBe(40);
    expect(insights.topCustomers).toHaveLength(1);
  });

  it('filters by name or phone', () => {
    const rows = [
      row({ user_id: '1', name: 'Priya Sharma', phone: '+919876543210' }),
      row({ user_id: '2', name: 'Asha', phone: '+919111111111' }),
    ];
    expect(filterCustomerRows(rows, 'priya')).toHaveLength(1);
    expect(filterCustomerRows(rows, '9111')).toHaveLength(1);
    expect(filterCustomerRows(rows, '')).toHaveLength(2);
  });
});
