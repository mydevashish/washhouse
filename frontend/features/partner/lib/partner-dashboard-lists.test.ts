import {
  mapPartnerDashboardRecentOrders,
  mapPartnerDashboardTopCustomers,
  partnerDashboardOrderHref,
  partnerDashboardOrderServiceLabel,
  partnerDashboardStatusPill,
  PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF,
  PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF,
} from '@/features/partner/lib/partner-dashboard-lists';
import type { CustomerInsightRow } from '@/services/customer-insights';
import type { PartnerOrder } from '@/services/partner';

function order(partial: Partial<PartnerOrder> & Pick<PartnerOrder, 'id' | 'status' | 'tracking_code'>): PartnerOrder {
  return {
    laundry_id: 'l1',
    pickup_at: new Date().toISOString(),
    delivery_at: new Date().toISOString(),
    subtotal_inr: '100',
    delivery_fee_inr: '0',
    cgst_inr: '0',
    sgst_inr: '0',
    total_inr: '450.00',
    paid_inr: '450.00',
    pending_inr: '0.00',
    payment_status: 'paid',
    customer_name: 'Anita',
    items: [{ service_name: 'Dry Cleaning', quantity: 1, line_total_inr: '450.00' }],
    order_source: 'online',
    ...partial,
  };
}

describe('partnerDashboardStatusPill', () => {
  it('keeps ready out of In Process', () => {
    expect(partnerDashboardStatusPill('washing')).toBe('In Process');
    expect(partnerDashboardStatusPill('ready')).toBe('Ready');
    expect(partnerDashboardStatusPill('confirmed')).toBe('Pending');
    expect(partnerDashboardStatusPill('delivered')).toBe('Completed');
  });
});

describe('partnerDashboardOrderServiceLabel', () => {
  it('uses first name or N items', () => {
    expect(partnerDashboardOrderServiceLabel([])).toBe('—');
    expect(
      partnerDashboardOrderServiceLabel([{ service_name: 'Wash & Iron', quantity: 1, line_total_inr: '1' }]),
    ).toBe('Wash & Iron');
    expect(
      partnerDashboardOrderServiceLabel([
        { service_name: 'A', quantity: 1, line_total_inr: '1' },
        { service_name: 'B', quantity: 1, line_total_inr: '1' },
      ]),
    ).toBe('2 items');
  });
});

describe('mapPartnerDashboardRecentOrders', () => {
  it('maps tracking codes and order detail hrefs', () => {
    const rows = mapPartnerDashboardRecentOrders([
      order({ id: 'ord-1', tracking_code: 'WH-1001', status: 'washing' }),
    ]);
    expect(rows[0]).toMatchObject({
      trackingCode: 'WH-1001',
      href: partnerDashboardOrderHref('ord-1'),
      statusPill: 'In Process',
      service: 'Dry Cleaning',
    });
    expect(rows[0]?.href).toBe('/partner/orders/ord-1');
    expect(PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF).toBe('/partner/orders');
  });
});

describe('mapPartnerDashboardTopCustomers', () => {
  it('links rows to the customers directory (no phone search contract)', () => {
    const customer: CustomerInsightRow = {
      user_id: 'u1',
      name: 'Riya',
      phone: '+919876543210',
      lifetime_spend_inr: '8450.00',
      order_count: 18,
      avg_order_value_inr: '100',
      last_order_at: null,
      first_order_at: null,
      retention_score: 80,
      segment: 'vip',
      segment_label: 'VIP',
      is_high_risk: false,
      dispute_count: 0,
      risk_label: '',
    };
    const rows = mapPartnerDashboardTopCustomers([customer]);
    expect(rows[0]?.href).toBe('/partner/customers');
    expect(rows[0]?.href).toBe(PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF);
    expect(rows[0]?.initial).toBe('R');
  });
});
