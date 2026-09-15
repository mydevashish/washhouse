import { formatServices } from '@/features/partner/lib/partner-derive';
import type { PartnerOrder } from '@/services/partner';

const base: PartnerOrder = {
  id: 'o1',
  laundry_id: 'l1',
  status: 'confirmed',
  tracking_code: 'DLM1',
  pickup_at: '2026-01-15T10:00:00.000Z',
  delivery_at: '2026-01-16T10:00:00.000Z',
  subtotal_inr: '80.00',
  delivery_fee_inr: '0.00',
  total_inr: '80.00',
  paid_inr: '0.00',
  pending_inr: '80.00',
  payment_status: 'pending',
  customer_name: 'Test',
  items: [],
};

describe('formatServices', () => {
  it('nests garments under wash services instead of piece-count × service', () => {
    expect(
      formatServices({
        ...base,
        items: [
          {
            service_name: 'Wash & Fold',
            quantity: 45,
            line_total_inr: '80.00',
            garments: [
              { garment_item_id: 'a', garment_name: 'Capri', quantity: 1 },
              { garment_item_id: 'b', garment_name: 'Coat', quantity: 1 },
            ],
          },
        ],
      }),
    ).toBe('Wash & Fold (Capri ×1, Coat ×1)');
  });
});
