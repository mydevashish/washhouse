import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import type { PartnerOrder } from '@/services/partner';

jest.mock('@/services/pickup-evidence', () => ({
  listPartnerPickupEvidence: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/inventory-verification', () => ({
  getPartnerInventoryVerification: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/delivery-otp', () => ({
  getPartnerDeliveryVerification: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/delivery-proof', () => ({
  getPartnerDeliveryProof: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/custody-timeline', () => ({
  getPartnerCustodyTimeline: jest.fn().mockResolvedValue({ events: [] }),
}));

jest.mock('@/features/pickup-evidence', () => ({
  PickupEvidenceGallery: () => null,
  PickupEvidenceUpload: () => <div data-testid="pickup-evidence-upload" />,
}));

jest.mock('@/features/inventory-verification', () => ({
  InventoryVerificationDisplay: () => null,
  InventoryVerificationForm: () => <div data-testid="inventory-form" />,
}));

jest.mock('@/features/delivery-otp', () => ({
  DeliveryOtpVerifyForm: () => null,
}));

jest.mock('@/features/delivery-proof', () => ({
  DeliveryProofDisplay: () => null,
  DeliveryProofUpload: () => null,
}));

jest.mock('@/features/chain-of-custody', () => ({
  CustodyTimelineDialog: () => null,
}));

jest.mock('@/features/partner-shop-floor/components/print-order-actions', () => ({
  PrintOrderActions: () => null,
}));

const baseOrder: PartnerOrder = {
  id: 'order-1',
  laundry_id: 'laundry-1',
  status: 'pickup_assigned',
  tracking_code: 'DLMTEST01',
  pickup_at: '2026-01-15T10:00:00.000Z',
  delivery_at: '2026-01-16T10:00:00.000Z',
  subtotal_inr: '200.00',
  delivery_fee_inr: '49.00',
  cgst_inr: '22.41',
  sgst_inr: '22.41',
  total_inr: '293.82',
  customer_name: 'Test Customer',
  customer_phone: '+919876543210',
  order_source: 'online',
  items: [],
  payment_status: 'pending',
  paid_inr: '0.00',
  pending_inr: '293.82',
};

function renderCard(order: PartnerOrder) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PartnerOrderCard
        order={order}
        onAccept={jest.fn()}
        onReject={jest.fn()}
        onAdvance={jest.fn()}
      />
    </QueryClientProvider>,
  );
}

describe('PartnerOrderCard pickup gates', () => {
  it('shows specific blocker message when photos and inventory are missing', async () => {
    renderCard(baseOrder);

    expect(await screen.findByTestId('partner-pickup-blocker')).toHaveTextContent(
      /upload pickup photos and record item inventory before continuing/i,
    );
    expect(screen.getByTestId('partner-order-advance')).toBeDisabled();
  });

  it('shows inventory-only blocker for walk-in at confirmed', async () => {
    renderCard({
      ...baseOrder,
      status: 'confirmed',
      order_source: 'walk_in',
    });

    expect(await screen.findByTestId('partner-pickup-blocker')).toHaveTextContent(
      /record item inventory before continuing/i,
    );
    expect(screen.queryByText(/upload pickup photos/i)).not.toBeInTheDocument();
  });
});
