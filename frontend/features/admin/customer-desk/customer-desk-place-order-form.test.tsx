import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { CustomerDeskPlaceOrderForm } from '@/features/admin/customer-desk/components/customer-desk-place-order-form';
import type { CustomerDeskProfile } from '@/features/admin/customer-desk/types';

jest.mock('@/services/admin', () => ({
  listAllLaundries: jest.fn().mockResolvedValue([
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Sparkle Wash',
      city: 'Bengaluru',
      status: 'approved',
      is_verified: true,
    },
  ]),
}));

jest.mock('@/services/laundries', () => ({
  getLaundry: jest.fn().mockResolvedValue({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Sparkle Wash',
    services: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Wash & Fold',
        category: 'wash',
        unit: 'kg',
        price_inr: '100.00',
        is_active: true,
      },
    ],
  }),
}));

jest.mock('@/features/admin/customer-desk/hooks', () => ({
  useAdminAssistedOrderMutations: () => ({
    createM: { mutate: jest.fn(), isPending: false },
    quoteM: { mutate: jest.fn(), isPending: false },
  }),
}));

const profile: CustomerDeskProfile = {
  user_id: null,
  name: 'Priya',
  phone: '+919876543210',
  email: null,
  registered: false,
  order_count: 0,
  last_order_at: null,
};

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('CustomerDeskPlaceOrderForm validation', () => {
  it('surfaces required-field errors when submitted empty', async () => {
    const user = userEvent.setup();
    render(
      wrap(
        <CustomerDeskPlaceOrderForm
          profile={profile}
          onCreateBookingRequest={jest.fn()}
        />,
      ),
    );

    await user.clear(screen.getByLabelText(/customer name/i));
    await user.click(screen.getByRole('button', { name: /place doorstep order/i }));

    await waitFor(() => {
      expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Select a laundry')).toBeInTheDocument();
    expect(screen.getByText('Address is required')).toBeInTheDocument();
  });

  it('exposes booking-request handoff link', () => {
    const onBr = jest.fn();
    render(
      wrap(
        <CustomerDeskPlaceOrderForm profile={profile} onCreateBookingRequest={onBr} />,
      ),
    );
    expect(
      screen.getByRole('button', { name: /create booking request instead/i }),
    ).toBeInTheDocument();
  });
});
