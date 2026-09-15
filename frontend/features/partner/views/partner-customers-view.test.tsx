import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';

const createPartnerCustomer = jest.fn();
const listPartnerCustomerInsights = jest.fn();
const usePartnerQueriesEnabled = jest.fn(() => true);

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => usePartnerQueriesEnabled(),
}));

jest.mock('@/features/partner/customer-desk/api', () => ({
  createPartnerCustomer: (...args: unknown[]) => createPartnerCustomer(...args),
}));

jest.mock('@/services/customer-insights', () => ({
  listPartnerCustomerInsights: (...args: unknown[]) => listPartnerCustomerInsights(...args),
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const customerPage = {
  items: [
    {
      customer_id: 'customer-1',
      user_id: 'user-1',
      name: 'Priya Sharma',
      phone: '+919876543210',
      lifetime_spend_inr: '2500.00',
      order_count: 6,
      avg_order_value_inr: '416.67',
      last_order_at: '2026-08-10T10:00:00.000Z',
      first_order_at: '2026-01-02T10:00:00.000Z',
      retention_score: 74,
      segment: 'active' as const,
      segment_label: 'Regular (active)',
      is_high_risk: false,
      dispute_count: 0,
      risk_label: 'Low risk',
    },
  ],
  page: 1,
  page_size: 10,
  total_records: 1,
  total_pages: 1,
  has_next: false,
  has_previous: false,
};

describe('PartnerCustomersView', () => {
  beforeEach(() => {
    usePartnerQueriesEnabled.mockReturnValue(true);
    listPartnerCustomerInsights.mockResolvedValue(customerPage);
    createPartnerCustomer.mockResolvedValue({
      customer_id: 'customer-2',
      user_id: 'user-2',
      name: 'New Customer',
      phone: '+919876543211',
      registered: true,
      order_count: 0,
      last_order_at: null,
    });
  });

  it('shows customers returned by the partner directory API', async () => {
    render(wrap(<PartnerCustomersView />));

    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument();
    expect(listPartnerCustomerInsights).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      search: undefined,
    });
    expect(screen.queryByText('Mehak Singh')).not.toBeInTheDocument();
  });

  it('persists a new customer before refreshing the directory', async () => {
    const user = userEvent.setup();
    render(wrap(<PartnerCustomersView />));
    await screen.findByText('Priya Sharma');

    await user.click(screen.getByRole('button', { name: /add new customer/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'New Customer');
    await user.type(screen.getByLabelText(/mobile number/i), '9876543211');
    await user.click(screen.getByRole('button', { name: /^add customer$/i }));

    await waitFor(() => {
      expect(createPartnerCustomer).toHaveBeenCalledWith({
        name: 'New Customer',
        phone: '+919876543211',
      });
    });
  });
});
