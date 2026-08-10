import { buildWalkInOrderReceivedWhatsAppBody } from '@/features/partner/lib/walk-in-order-received-whatsapp';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

describe('buildWalkInOrderReceivedWhatsAppBody', () => {
  const base: WalkInOrder = {
    id: '1',
    laundry_id: '2',
    status: 'confirmed',
    tracking_code: 'DLM-ABC',
    pickup_at: '2026-08-10T10:00:00Z',
    delivery_at: '2026-08-12T14:30:00Z',
    subtotal_inr: '100.00',
    delivery_fee_inr: '0.00',
    cgst_inr: '9.00',
    sgst_inr: '9.00',
    total_inr: '118.00',
    payment_status: 'pending',
    customer_name: 'Priya',
    customer_phone: '+919876543210',
    partner_notes: null,
    user_id: null,
    expected_ready_at: '2026-08-12T14:30:00Z',
    token_code: 'R-42',
    color_token: 'red',
    items: [{ service_name: 'Shirt', quantity: 2, line_total_inr: '100' }],
  };

  it('includes items, token, and balance due', () => {
    const body = buildWalkInOrderReceivedWhatsAppBody(base, 'Sparkle Wash');
    expect(body).toContain('Priya');
    expect(body).toContain('DLM-ABC');
    expect(body).toContain('2 × Shirt');
    expect(body).toContain('R-42');
    expect(body).toContain('balance due');
    expect(body).toContain('Sparkle Wash');
  });
});
