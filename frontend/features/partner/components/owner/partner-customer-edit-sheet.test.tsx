import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PartnerCustomerEditSheet } from '@/features/partner/components/owner/partner-customer-edit-sheet';
import type { CustomerInsightRow } from '@/services/customer-insights';

jest.mock('@/features/partner/customer-desk/api', () => ({
  lookupPartnerCustomer: jest.fn(),
  updatePartnerCustomer: jest.fn(),
}));

import { lookupPartnerCustomer, updatePartnerCustomer } from '@/features/partner/customer-desk/api';

const mockLookup = lookupPartnerCustomer as jest.MockedFunction<typeof lookupPartnerCustomer>;
const mockUpdate = updatePartnerCustomer as jest.MockedFunction<typeof updatePartnerCustomer>;

const customer: CustomerInsightRow = {
  user_id: 'user-1',
  name: 'Priya Sharma',
  phone: '+919876543210',
  lifetime_spend_inr: '1200.00',
  order_count: 4,
  avg_order_value_inr: '300.00',
  last_order_at: '2026-01-01T00:00:00.000Z',
  first_order_at: '2025-06-01T00:00:00.000Z',
  retention_score: 80,
  segment: 'active',
  segment_label: 'Active',
  is_high_risk: false,
  dispute_count: 0,
  risk_label: 'Low',
};

function renderSheet(open = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <PartnerCustomerEditSheet customer={customer} open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

describe('PartnerCustomerEditSheet', () => {
  beforeEach(() => {
    mockLookup.mockReset();
    mockUpdate.mockReset();
    mockLookup.mockResolvedValue({
      user_id: customer.user_id,
      name: customer.name,
      phone: customer.phone!,
      email: 'priya@example.com',
      registered: true,
      order_count: 4,
      last_order_at: customer.last_order_at,
      gender: 'female',
      notes: 'VIP counter',
    });
  });

  it('blocks save when name is cleared', async () => {
    const user = userEvent.setup();
    renderSheet();

    await waitFor(() => {
      expect(screen.getByTestId('partner-customer-edit-name')).toHaveValue('Priya Sharma');
    });

    await user.clear(screen.getByTestId('partner-customer-edit-name'));
    await user.click(screen.getByTestId('partner-customer-edit-save'));

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
  });

  it('shows read-only banner for unregistered guests', async () => {
    mockLookup.mockResolvedValue({
      user_id: null,
      name: 'Walk-in Guest',
      phone: customer.phone!,
      email: null,
      registered: false,
      order_count: 1,
      last_order_at: null,
    });
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText(/Register on first order/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('partner-customer-edit-save')).toBeDisabled();
  });

  it('submits trimmed profile updates', async () => {
    mockUpdate.mockResolvedValue({
      user_id: customer.user_id,
      name: 'Priya S.',
      phone: customer.phone ?? null,
      email: 'priya@example.com',
      gender: 'female',
      notes: 'VIP counter',
      registered: true,
    });
    const user = userEvent.setup();
    renderSheet();

    await waitFor(() => {
      expect(screen.getByTestId('partner-customer-edit-name')).toHaveValue('Priya Sharma');
    });

    await user.clear(screen.getByTestId('partner-customer-edit-name'));
    await user.type(screen.getByTestId('partner-customer-edit-name'), 'Priya S.');
    await user.click(screen.getByTestId('partner-customer-edit-save'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(customer.user_id, {
        name: 'Priya S.',
        email: 'priya@example.com',
        gender: 'female',
        notes: 'VIP counter',
      });
    });
  });
});
