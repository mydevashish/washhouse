import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';

const listPartnerCustomerInsights = jest.fn();
const usePartnerQueriesEnabled = jest.fn(() => true);

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => usePartnerQueriesEnabled(),
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

describe('PartnerCustomersView', () => {
  beforeEach(() => {
    usePartnerQueriesEnabled.mockReturnValue(true);
    listPartnerCustomerInsights.mockResolvedValue({
      items: [
        {
          user_id: 'user-1',
          name: 'Priya Sharma',
          phone: '+919876543210',
          lifetime_spend_inr: '2500.00',
          order_count: 6,
          avg_order_value_inr: '416.67',
          last_order_at: '2026-08-10T10:00:00.000Z',
          first_order_at: '2026-01-02T10:00:00.000Z',
          retention_score: 74,
          segment: 'active',
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
    });
  });

  it('shows the simple customer directory layout with search and edit action', async () => {
    render(wrap(<PartnerCustomersView />));

    expect(await screen.findByRole('heading', { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search customers/i)).toBeInTheDocument();
    expect(screen.getByTestId('owner-customer-grid')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit priya sharma/i })).toBeInTheDocument();
    expect(screen.queryByText(/customer insights/i)).not.toBeInTheDocument();
  });
});
