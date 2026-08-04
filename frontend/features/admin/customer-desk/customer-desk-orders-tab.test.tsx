import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { CustomerDeskOrdersTab } from '@/features/admin/customer-desk/components/customer-desk-orders-tab';
import { CustomerDeskResults } from '@/features/admin/customer-desk/components/customer-desk-results';
import type { CustomerDeskOrderRow, CustomerDeskProfile } from '@/features/admin/customer-desk/types';

jest.mock('@/features/admin/customer-desk/hooks', () => ({
  useAdminCustomerDeskOrders: jest.fn(),
}));

import { useAdminCustomerDeskOrders } from '@/features/admin/customer-desk/hooks';

const mockOrders = useAdminCustomerDeskOrders as jest.MockedFunction<
  typeof useAdminCustomerDeskOrders
>;

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function orderRow(overrides: Partial<CustomerDeskOrderRow> = {}): CustomerDeskOrderRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    tracking_code: 'DLMTEST01',
    status: 'confirmed',
    order_source: 'assisted_admin',
    laundry_id: '22222222-2222-4222-8222-222222222222',
    laundry_name: 'Sparkle Wash',
    customer_name: 'Priya',
    customer_phone: '+919876543210',
    subtotal_inr: '200.00',
    delivery_fee_inr: '49.00',
    cgst_inr: '22.41',
    sgst_inr: '22.41',
    total_inr: '293.82',
    currency: 'INR',
    pickup_at: '2026-08-04T10:00:00Z',
    delivery_at: '2026-08-05T18:00:00Z',
    created_at: '2026-08-04T08:00:00Z',
    created_by_user_id: null,
    item_summary: 'Wash & Fold ×1',
    ...overrides,
  };
}

describe('CustomerDeskOrdersTab empty state', () => {
  beforeEach(() => {
    mockOrders.mockReset();
  });

  it('shows empty state with Place first order CTA', async () => {
    const user = userEvent.setup();
    const onPlace = jest.fn();
    mockOrders.mockReturnValue({
      data: {
        items: [],
        page: 1,
        page_size: 20,
        total_records: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
      error: null,
    } as unknown as ReturnType<typeof useAdminCustomerDeskOrders>);

    render(
      wrap(
        <CustomerDeskOrdersTab
          profile={{ user_id: null, phone: '+919876543210' }}
          open
          onPlaceFirstOrder={onPlace}
        />,
      ),
    );

    expect(screen.getByText(/no past orders yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /place first order/i }));
    expect(onPlace).toHaveBeenCalledTimes(1);
  });

  it('paginates with Previous / Next when has_next', async () => {
    const user = userEvent.setup();
    mockOrders.mockImplementation((_profile, _open, filters) => {
      const page = filters?.page ?? 1;
      return {
        data: {
          items: [orderRow({ tracking_code: page === 1 ? 'DLMPAGE1' : 'DLMPAGE2' })],
          page,
          page_size: 20,
          total_records: 40,
          total_pages: 2,
          has_next: page < 2,
          has_previous: page > 1,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: jest.fn(),
        error: null,
      } as unknown as ReturnType<typeof useAdminCustomerDeskOrders>;
    });

    render(
      wrap(
        <CustomerDeskOrdersTab
          profile={{ user_id: null, phone: '+919876543210' }}
          open
          onPlaceFirstOrder={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(/#DLMPAGE1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/#DLMPAGE2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
  });
});

describe('CustomerDeskResults', () => {
  const profile: CustomerDeskProfile = {
    user_id: '33333333-3333-4333-8333-333333333333',
    name: 'Priya Sharma',
    phone: '+919876543210',
    email: 'priya@example.com',
    registered: true,
    order_count: 2,
    last_order_at: '2026-08-01T10:00:00Z',
  };

  it('renders max results and selects a row', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const results = Array.from({ length: 20 }, (_, i) => ({
      ...profile,
      phone: `+9198765432${String(i).padStart(2, '0')}`,
      name: `Caller ${i}`,
      user_id: null,
      registered: false,
    }));

    render(
      <CustomerDeskResults query="Caller" results={results} onSelect={onSelect} />,
    );

    expect(screen.getByRole('listbox', { name: /search results/i })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(20);
    await user.click(screen.getByRole('option', { name: /caller 0/i }));
    expect(onSelect).toHaveBeenCalledWith(results[0]);
  });

  it('shows empty match CTA', async () => {
    const user = userEvent.setup();
    const onCreateGuest = jest.fn();
    render(
      <CustomerDeskResults
        query="Nobody"
        results={[]}
        onSelect={jest.fn()}
        onCreateGuest={onCreateGuest}
      />,
    );
    await user.click(screen.getByRole('button', { name: /create guest order/i }));
    expect(onCreateGuest).toHaveBeenCalled();
  });
});
