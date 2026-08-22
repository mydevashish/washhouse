import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

jest.mock('@/services/pickup-evidence', () => ({
  listPartnerPickupEvidence: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/custody-timeline', () => ({
  getPartnerCustodyTimeline: jest.fn().mockResolvedValue({ events: [] }),
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerOrderMutations: () => ({
    acceptMutation: { mutate: jest.fn(), isPending: false },
    rejectMutation: { mutate: jest.fn(), isPending: false },
    advanceOrder: jest.fn(),
    advanceMutation: { isPending: false },
    isBusy: false,
  }),
}));

jest.mock('@/services/partner', () => ({
  listPartnerOrders: jest.fn(),
}));

const partialOrder: PartnerOrder = {
  id: 'order-partial',
  laundry_id: 'laundry-1',
  status: 'confirmed',
  tracking_code: 'WH-PARTIAL',
  pickup_at: '2026-01-15T10:00:00.000Z',
  delivery_at: '2026-01-16T10:00:00.000Z',
  subtotal_inr: '400.00',
  delivery_fee_inr: '0.00',
  // cgst_inr: '36.00',
  // sgst_inr: '36.00',
  total_inr: '472.00',
  paid_inr: '200.00',
  pending_inr: '272.00',
  payment_status: 'pending_cod',
  customer_name: 'Partial Guest',
  customer_phone: '+919876543210',
  order_source: 'walk_in',
  items: [{ service_name: 'Wash & Fold', quantity: 1, line_total_inr: '400.00' }],
};

describe('PartnerOrdersTable payment columns', () => {
  beforeEach(() => {
    jest.mocked(listPartnerOrders).mockResolvedValue({
      items: [partialOrder],
      page: 1,
      page_size: 10,
      total_records: 1,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it('renders paid and pending_inr amounts on desktop table', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <PartnerOrdersTable />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('partner-orders-table-root')).toBeInTheDocument();
    });

    const desktop = screen.getByTestId('partner-orders-table-desktop');
    expect(desktop).toHaveTextContent('₹472');
    expect(desktop).toHaveTextContent('₹200');
    expect(desktop).toHaveTextContent('₹272');
    expect(screen.getByTestId('partner-order-unpaid-badge')).toHaveTextContent('Unpaid');
  });
});
