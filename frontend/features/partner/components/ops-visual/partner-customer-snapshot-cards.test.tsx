import { render, screen } from '@testing-library/react';

import {
  PartnerCustomerIdentitySummary,
  PartnerCustomerSnapshotCards,
} from '@/features/partner/components/ops-visual/partner-customer-snapshot-cards';

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

  it('shows plan and wallet details when available inside customer value', () => {
    render(
      <PartnerCustomerSnapshotCards
        profile={{
          user_id: 'user-1',
          name: 'Riya',
          phone: '+919876543210',
          email: null,
          registered: true,
          order_count: 4,
          last_order_at: null,
        }}
        stats={{
          lifetime_spend_inr: '2500.00',
          segment_label: 'Regular',
          plan_name: 'Premium Care',
          plan_amount_inr: '2999.00',
          wallet_used_inr: '1500.00',
          wallet_remaining_inr: '1499.00',
        }}
      />,
    );

    expect(screen.getByText('Plan / Wallet')).toBeInTheDocument();
    expect(screen.getByText('Premium Care')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('shows plan and wallet details beside customer identity in review summary', () => {
    render(
      <PartnerCustomerIdentitySummary
        name="Riya Sharma"
        phone="+919876543210"
        stats={{
          plan_name: 'Premium Care',
          wallet_used_inr: '1500.00',
          wallet_remaining_inr: '1499.00',
          plan_amount_inr: '2999.00',
        }}
      />,
    );

    expect(screen.getByText('Riya Sharma')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();
    expect(screen.getByText('Plan / Wallet')).toBeInTheDocument();
    expect(screen.getByText('Premium Care')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
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
