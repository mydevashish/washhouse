import { render, screen } from '@testing-library/react';

import { PartnerOrderDemoLiveComposer } from '@/features/partner/components/ops-visual/partner-order-demo-live-composer';
import type { PartnerWalkInOrderComposer } from '@/features/partner/hooks/use-partner-walk-in-order-composer';

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false, mutateAsync: jest.fn() }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useQuery: () => ({ isLoading: false, isError: false, data: undefined, refetch: jest.fn() }),
}));

jest.mock('@/features/partner-price-list/components/partner-garment-offer-dialog', () => ({
  PartnerGarmentOfferDialog: () => null,
}));

function buildComposerStub(): PartnerWalkInOrderComposer {
  return {
    step: 'customer',
    setStep: jest.fn(),
    intakeMode: 'services',
    switchIntakeMode: jest.fn(),
    customerName: '',
    setCustomerName: jest.fn(),
    customerPhone: '',
    setCustomerPhone: jest.fn(),
    customerGender: null,
    setCustomerGender: jest.fn(),
    notes: '',
    setNotes: jest.fn(),
    expectedReadyAt: '',
    setExpectedReadyAt: jest.fn(),
    serviceItems: [],
    garmentLines: [],
    category: 'all',
    setCategory: jest.fn(),
    createdOrder: null,
    setCreatedOrder: jest.fn(),
    services: [],
    servicesQ: { isLoading: false } as PartnerWalkInOrderComposer['servicesQ'],
    priceListQ: { isLoading: false } as PartnerWalkInOrderComposer['priceListQ'],
    garmentTiles: [],
    visibleGarmentTiles: [],
    loadingGarments: false,
    walkInLookupQ: {} as PartnerWalkInOrderComposer['walkInLookupQ'],
    walkInProfile: null,
    walkInSnapshotProfile: null,
    walkInInsightQ: {} as PartnerWalkInOrderComposer['walkInInsightQ'],
    insightStats: null,
    lineRows: [],
    estimatedSubtotal: 0,
    pieceCount: 0,
    addServiceWithQty: jest.fn(),
    addCatalogLines: jest.fn(),
    setServiceQty: jest.fn(),
    removeServiceLine: jest.fn(),
    setLineQty: jest.fn(),
    removeLine: jest.fn(),
    processForTile: jest.fn(),
    qtyForTile: jest.fn(),
    bumpTile: jest.fn(),
    changeProcess: jest.fn(),
    goFromCustomer: jest.fn(),
    goFromIntake: jest.fn(),
    submitOrder: jest.fn(),
    validateForSubmit: jest.fn(),
    resetWorkspace: jest.fn(),
    applyCustomerFromSearch: jest.fn(),
    createMutation: { isPending: false, mutate: jest.fn() } as unknown as PartnerWalkInOrderComposer['createMutation'],
    startWashMutation: { isPending: false, mutate: jest.fn() } as unknown as PartnerWalkInOrderComposer['startWashMutation'],
    customerPanel: { name: '', phone: '', address: null },
    checkoutTotals: {
      subtotal: 0,
      discount: 0,
      pickupCharge: 0,
      deliveryCharge: 0,
      packingCharge: 0,
      sgst: 0,
      cgst: 0,
      grandTotal: 0,
      serviceCount: 0,
      itemCount: 0,
    },
    couponCode: '',
    setCouponCode: jest.fn(),
    couponApplied: false,
    toggleCouponApplied: jest.fn(),
    applyCoupon: jest.fn(),
    applyCouponPending: false,
    couponError: null,
    deliveryType: 'Both',
    setDeliveryType: jest.fn(),
    preferredDeliveryDate: '',
    setPreferredDeliveryDate: jest.fn(),
    paymentMethod: 'Cash',
    setPaymentMethod: jest.fn(),
  };
}

describe('PartnerOrderDemoLiveComposer', () => {
  it('shows draft invoice ref without fake invoice numbers', () => {
    render(<PartnerOrderDemoLiveComposer composer={buildComposerStub()} />);
    expect(screen.getByText(/New order \/ Create order/i)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/INV-WH-/i)).not.toBeInTheDocument();
  });

  it('disables create when line items empty', () => {
    render(<PartnerOrderDemoLiveComposer composer={buildComposerStub()} />);
    expect(screen.getByTestId('partner-create-order-submit')).toBeDisabled();
  });
});
