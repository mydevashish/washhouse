import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerCustomerDeskOrdersTab } from '@/features/partner/customer-desk/components/partner-customer-desk-orders-tab';
import { PartnerCustomerDeskResults } from '@/features/partner/customer-desk/components/partner-customer-desk-results';
import { PartnerCustomerDeskSearch } from '@/features/partner/customer-desk/components/partner-customer-desk-search';
import { parseItemSummary } from '@/features/partner/customer-desk/schemas';

jest.mock('@/features/partner/customer-desk/hooks', () => ({
  usePartnerCustomerDeskOrders: jest.fn(),
}));

import { usePartnerCustomerDeskOrders } from '@/features/partner/customer-desk/hooks';

const mockOrders = usePartnerCustomerDeskOrders as jest.MockedFunction<
  typeof usePartnerCustomerDeskOrders
>;

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerCustomerDeskSearch', () => {
  it('primary New order CTA looks up a normalized phone', async () => {
    const user = userEvent.setup();
    const onNewOrder = jest.fn();
    render(<PartnerCustomerDeskSearch onNewOrder={onNewOrder} onOpenDesk={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/priya or/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /new order/i }));

    expect(onNewOrder).toHaveBeenCalledWith({ kind: 'phone', phone: '+919876543210' });
  });

  it('Open desk secondary CTA opens desk without new-order intent', async () => {
    const user = userEvent.setup();
    const onOpenDesk = jest.fn();
    render(<PartnerCustomerDeskSearch onNewOrder={jest.fn()} onOpenDesk={onOpenDesk} />);

    await user.type(screen.getByPlaceholderText(/priya or/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /open desk/i }));

    expect(onOpenDesk).toHaveBeenCalledWith({ kind: 'phone', phone: '+919876543210' });
  });

  it('name query is submitted for server search', async () => {
    const user = userEvent.setup();
    const onNewOrder = jest.fn();
    render(<PartnerCustomerDeskSearch onNewOrder={onNewOrder} onOpenDesk={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/priya or/i), 'Priya');
    await user.click(screen.getByRole('button', { name: /new order/i }));

    expect(onNewOrder).toHaveBeenCalledWith({ kind: 'query', q: 'Priya' });
  });
});

describe('PartnerCustomerDeskOrdersTab scoped empty state', () => {
  beforeEach(() => {
    mockOrders.mockReset();
  });

  it('shows laundry-scoped empty copy and New order CTA', async () => {
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
    } as unknown as ReturnType<typeof usePartnerCustomerDeskOrders>);

    render(
      wrap(
        <PartnerCustomerDeskOrdersTab
          profile={{ user_id: null, phone: '+919876543210' }}
          open
          onPlaceFirstOrder={onPlace}
          onReorder={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(/no past orders at your laundry/i)).toBeInTheDocument();
    expect(screen.getByText(/only your laundry/i)).toBeInTheDocument();
    expect(screen.getByText(/other laundries/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /new order/i }));
    expect(onPlace).toHaveBeenCalledTimes(1);
  });

  it('paginates laundry-scoped history with Next', async () => {
    const user = userEvent.setup();
    mockOrders.mockImplementation((_profile, _open, filters) => {
      const page = filters?.page ?? 1;
      return {
        data: {
          items: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              tracking_code: page === 1 ? 'DLMOWN1' : 'DLMOWN2',
              status: 'confirmed',
              order_source: 'assisted_partner',
              laundry_id: '22222222-2222-4222-8222-222222222222',
              laundry_name: 'My Shop',
              customer_name: 'Priya',
              customer_phone: '+919876543210',
              subtotal_inr: '100.00',
              delivery_fee_inr: '49.00',
              cgst_inr: '13.41',
              sgst_inr: '13.41',
              total_inr: '175.82',
              currency: 'INR',
              pickup_at: '2026-08-04T10:00:00Z',
              delivery_at: '2026-08-05T18:00:00Z',
              created_at: '2026-08-04T08:00:00Z',
              created_by_user_id: null,
              item_summary: 'Wash ×1',
            },
          ],
          page,
          page_size: 20,
          total_records: 25,
          total_pages: 2,
          has_next: page < 2,
          has_previous: page > 1,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: jest.fn(),
        error: null,
      } as unknown as ReturnType<typeof usePartnerCustomerDeskOrders>;
    });

    render(
      wrap(
        <PartnerCustomerDeskOrdersTab
          profile={{ user_id: null, phone: '+919876543210' }}
          open
          onPlaceFirstOrder={jest.fn()}
          onReorder={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText(/#DLMOWN1/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/#DLMOWN2/i)).toBeInTheDocument();
  });
});

describe('PartnerCustomerDeskResults', () => {
  it('lists matches and selects a profile', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <PartnerCustomerDeskResults
        query="Priya"
        results={[
          {
            user_id: null,
            name: 'Priya Guest',
            phone: '+919876543210',
            email: null,
            registered: false,
            order_count: 1,
            last_order_at: '2026-08-01T10:00:00Z',
          },
        ]}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('option', { name: /priya guest/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+919876543210' }),
    );
  });
});

describe('parseItemSummary', () => {
  it('parses quantity markers for reorder matching', () => {
    expect(parseItemSummary('Wash & Fold ×2, Dry Clean ×1')).toEqual([
      { name: 'Wash & Fold', quantity: 2 },
      { name: 'Dry Clean', quantity: 1 },
    ]);
  });
});
