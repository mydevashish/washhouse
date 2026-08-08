import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PartnerOrdersTodayPanel } from '@/features/partner/orders-hub/partner-orders-today-panel';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
  usePartnerOrders: () => ({
    isLoading: false,
    isError: false,
    data: {
      items: [],
      page: 1,
      page_size: 10,
      total_records: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    },
  }),
}));

jest.mock('@/features/partner/booking-requests/hooks', () => ({
  usePartnerBookingRequestsList: () => ({
    isLoading: false,
    data: {
      items: [
        {
          id: 'br-1',
          public_code: 'BR-TEST1',
          customer_name: 'Riya',
          phone_e164: '+919876543210',
          service_type: 'wash-fold',
          preferred_time_window: 'flexible',
          address_text: null,
          city: null,
          pincode: null,
          notes: null,
          source: 'book_now',
          status: 'assigned',
          priority: 'normal',
          sla_badge: 'ok',
          sla_age_seconds: 60,
          assigned_laundry_id: null,
          assigned_laundry_name: null,
          assigned_at: null,
          assigned_by_user_id: null,
          converted_order_id: null,
          created_by_role: 'admin',
          created_by_user_id: null,
          last_response_at: null,
          closed_at: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          whatsapp_url: 'https://wa.me/919876543210',
          open_duplicate_ids: [],
        },
      ],
      page: 1,
      page_size: 5,
      total: 1,
      total_pages: 1,
      has_next: false,
      has_previous: false,
      inbox: {},
    },
  }),
}));

jest.mock('@/features/partner/customer-desk/components/partner-customer-desk-drawer', () => ({
  PartnerCustomerDeskDrawer: () => null,
}));

jest.mock(
  '@/features/partner/booking-requests/partner-booking-request-create-dialog',
  () => ({
    PartnerBookingRequestCreateDialog: () => null,
  }),
);

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ isFetching: false, isError: false, data: undefined }),
  };
});

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerOrdersTodayPanel', () => {
  it('renders slim metrics, compact find strip, and waiting requests link', () => {
    render(wrap(<PartnerOrdersTodayPanel orders={[]} />));

    expect(screen.getByTestId('partner-orders-today-strip')).toBeInTheDocument();
    expect(screen.getByTestId('partner-orders-find-strip')).toBeInTheDocument();
    expect(screen.getByLabelText(/find customer/i)).toBeInTheDocument();
    expect(screen.getByTestId('partner-orders-waiting-link')).toHaveAttribute(
      'href',
      '/partner/orders?tab=requests',
    );
    expect(screen.getByRole('link', { name: /1 waiting booking requests/i })).toBeInTheDocument();
  });
});
