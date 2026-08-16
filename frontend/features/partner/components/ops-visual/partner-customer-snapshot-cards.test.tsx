import { render, screen } from '@testing-library/react';

import { PartnerCustomerSnapshotCards } from '@/features/partner/components/ops-visual/partner-customer-snapshot-cards';

describe('PartnerCustomerSnapshotCards', () => {
  it('shows ₹0.00 total spent for registered customers with null spend', () => {
    render(
      <PartnerCustomerSnapshotCards
        profile={{
          user_id: 'user-1',
          name: 'Riya',
          phone: '+919876543210',
          email: null,
          registered: true,
          order_count: 2,
          last_order_at: null,
        }}
        stats={{ lifetime_spend_inr: null, segment_label: 'Regular' }}
      />,
    );

    expect(screen.getByTestId('partner-customer-total-spent')).toHaveTextContent('₹0');
  });

  it('shows ₹0.00 total spent for guest with valid phone and no prior orders', () => {
    render(
      <PartnerCustomerSnapshotCards
        profile={{
          user_id: null,
          name: 'Guest',
          phone: '+919876543210',
          email: null,
          registered: false,
          order_count: 0,
          last_order_at: null,
        }}
        stats={null}
      />,
    );

    expect(screen.getByTestId('partner-customer-total-spent')).toHaveTextContent('₹0');
  });

  it('shows em dash when no phone profile is available', () => {
    render(
      <PartnerCustomerSnapshotCards
        profile={{
          user_id: null,
          name: 'Guest',
          phone: '',
          email: null,
          registered: false,
          order_count: 0,
          last_order_at: null,
        }}
        stats={null}
      />,
    );

    expect(screen.getByTestId('partner-customer-total-spent')).toHaveTextContent('—');
  });
});
