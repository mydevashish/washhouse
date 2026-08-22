import { buildOwnerBriefItems } from '@/features/partner/lib/owner-brief';
import type { PartnerOrder } from '@/services/partner';

function order(partial: Partial<PartnerOrder> & Pick<PartnerOrder, 'id' | 'status'>): PartnerOrder {
  return {
    laundry_id: 'l1',
    tracking_code: 'T1',
    pickup_at: new Date().toISOString(),
    delivery_at: new Date().toISOString(),
    subtotal_inr: '100',
    delivery_fee_inr: '0',
    // cgst_inr: '0',
    // sgst_inr: '0',
    total_inr: '100',
    paid_inr: '100',
    pending_inr: '0',
    payment_status: 'paid',
    customer_name: 'Riya',
    items: [],
    order_source: 'online',
    ...partial,
  };
}

describe('buildOwnerBriefItems', () => {
  it('returns empty when nothing urgent', () => {
    expect(buildOwnerBriefItems({ orders: [] })).toEqual([]);
  });

  it('prioritizes needs-action, then booking requests, then pickups', () => {
    const items = buildOwnerBriefItems({
      orders: [
        order({ id: '1', status: 'confirmed', order_source: 'online' }),
        order({ id: '2', status: 'confirmed', order_source: 'online' }),
        order({ id: '3', status: 'pickup_assigned' }),
      ],
      bookingRequestsCount: 3,
      delayedOrders: 1,
    });
    expect(items.map((i) => i.id)).toEqual([
      'needs-action',
      'booking-requests',
      'pickups',
      'delayed',
    ]);
    expect(items[0]?.count).toBe(2);
    expect(items).toHaveLength(4);
  });

  it('caps at 5 items', () => {
    const items = buildOwnerBriefItems({
      orders: [
        order({ id: '1', status: 'confirmed' }),
        order({ id: '2', status: 'pickup_assigned' }),
        order({ id: '3', status: 'ready' }),
      ],
      bookingRequestsCount: 2,
      delayedOrders: 1,
      pendingSettlementInr: 500,
    });
    expect(items).toHaveLength(5);
  });

  it('shows calm-path ready handoff when deliveries dominate', () => {
    const items = buildOwnerBriefItems({
      orders: [order({ id: '1', status: 'ready' })],
    });
    expect(items[0]?.id).toBe('deliveries');
    expect(items[0]?.title).toMatch(/Ready/i);
  });
});
