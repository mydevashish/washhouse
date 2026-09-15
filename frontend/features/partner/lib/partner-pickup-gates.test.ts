import {
  canAdvancePastPickupGates,
  getPickupAdvanceBlockers,
  getPickupAdvanceDisabledReason,
  needsPickupEvidence,
  needsPickupInventory,
} from '@/features/partner/lib/partner-pickup-gates';
import type { PartnerOrder } from '@/services/partner';

describe('partner-pickup-gates', () => {
  const doorstepPickup: Pick<PartnerOrder, 'status' | 'order_source'> = {
    status: 'pickup_assigned',
    order_source: 'online',
  };

  const walkInConfirmed: Pick<PartnerOrder, 'status' | 'order_source'> = {
    status: 'confirmed',
    order_source: 'walk_in',
  };

  it('blocks doorstep picked up without photos and inventory', () => {
    const blockers = getPickupAdvanceBlockers(doorstepPickup, {
      hasEvidence: false,
      hasInventory: false,
    });
    expect(blockers).toEqual(['Upload pickup photos', 'Record item inventory']);
    expect(getPickupAdvanceDisabledReason(blockers)).toBe(
      'Upload pickup photos and record item inventory before continuing',
    );
  });

  it('allows doorstep when evidence and inventory are present', () => {
    expect(
      canAdvancePastPickupGates(doorstepPickup, { hasEvidence: true, hasInventory: true }),
    ).toBe(true);
  });

  it('walk-in never requires shirt/trouser inventory (garments are on the ticket)', () => {
    expect(needsPickupEvidence(walkInConfirmed)).toBe(false);
    expect(needsPickupInventory(walkInConfirmed)).toBe(false);
    expect(
      getPickupAdvanceBlockers(walkInConfirmed, { hasEvidence: false, hasInventory: false }),
    ).toEqual([]);
  });

  it('skips inventory when garments are already on the order', () => {
    const withGarments = {
      ...walkInConfirmed,
      items: [
        {
          service_name: 'Wash & Fold',
          quantity: 1,
          line_total_inr: '80.00',
          garments: [{ garment_item_id: 'g1', garment_name: 'Shirt', quantity: 2 }],
        },
      ],
    };
    expect(needsPickupInventory(withGarments)).toBe(false);
    expect(
      getPickupAdvanceBlockers(withGarments, { hasEvidence: false, hasInventory: false }),
    ).toEqual([]);
  });
});
