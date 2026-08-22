import { render, screen } from '@testing-library/react';

import { PartnerOrderCheckoutAside } from '@/features/partner/components/ops-visual/partner-order-checkout-aside';

describe('PartnerOrderCheckoutAside', () => {
  const baseProps = {
    totals: {
      subtotal: 1200,
      discount: 0,
      pickupCharge: 0,
      deliveryCharge: 0,
      packingCharge: 0,
      expressCharge: 0,
      advancePaid: 0,
      balanceDue: 1200,
      grandTotal: 1200,
      serviceCount: 2,
      itemCount: 2,
    },
    couponCode: '',
    onCouponCodeChange: jest.fn(),
    couponApplied: false,
    onToggleCoupon: jest.fn(),
    onApplyCoupon: jest.fn(),
    applyCouponPending: false,
    couponError: null,
    discountType: 'none' as const,
    onDiscountTypeChange: jest.fn(),
    discountValue: 0,
    onDiscountValueChange: jest.fn(),
    deliveryType: 'Walk-in' as const,
    onDeliveryTypeChange: jest.fn(),
    deliveryDate: '',
    onDeliveryDateChange: jest.fn(),
    paymentMethod: 'Cash',
    onPaymentMethodChange: jest.fn(),
    notes: '',
    onNotesChange: jest.fn(),
    pickupCharge: 0,
    onPickupChargeChange: jest.fn(),
    deliveryCharge: 0,
    onDeliveryChargeChange: jest.fn(),
    advancePaid: 0,
    onAdvancePaidChange: jest.fn(),
    walletRemainingInr: 0,
    walletAmountUsed: 0,
    onWalletAmountUsedChange: jest.fn(),
    planName: null,
    walletEnabled: false,
    onWalletEnabledChange: jest.fn(),
    expressOrder: false,
    onExpressOrderChange: jest.fn(),
    submitPending: false,
    submitDisabled: false,
    submitLabel: 'Create order',
    onSubmit: jest.fn(),
  };

  it('hides wallet payment option when customer has zero wallet balance', () => {
    render(<PartnerOrderCheckoutAside {...baseProps} walletRemainingInr={0} />);

    expect(screen.queryByRole('option', { name: 'Wallet' })).not.toBeInTheDocument();
  });

  it('shows split-payment fields when split mode is selected', () => {
    render(
      <PartnerOrderCheckoutAside
        {...baseProps}
        paymentMethod="Split"
        walletRemainingInr={500}
        walletAmountUsed={300}
      />,
    );

    expect(screen.getByText('Split payment')).toBeInTheDocument();
    expect(screen.getByLabelText('Cash amount')).toBeInTheDocument();
    expect(screen.getByLabelText('UPI amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Wallet amount')).toBeInTheDocument();
  });
});
