import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AdminOrdersTodayPanel } from '@/features/admin/orders-hub/admin-orders-today-panel';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/features/admin/booking-requests/hooks', () => ({
  useAdminBookingRequestsList: () => ({
    isLoading: false,
    data: {
      items: [],
      page: 1,
      page_size: 5,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
      inbox: {},
    },
  }),
}));

jest.mock('@/features/admin/customer-desk/components/customer-desk-drawer', () => ({
  CustomerDeskDrawer: () => null,
}));

jest.mock('@/features/admin/booking-requests/booking-request-create-dialog', () => ({
  BookingRequestCreateDialog: () => null,
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ isFetching: false, isError: false, data: [] }),
  };
});

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AdminOrdersTodayPanel', () => {
  it('renders find-customer panel and deep-links to desk and booking requests', () => {
    render(wrap(<AdminOrdersTodayPanel />));

    expect(screen.getByRole('heading', { name: /find customer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full customer desk/i })).toHaveAttribute(
      'href',
      '/admin/orders?tab=desk',
    );
    expect(screen.getByRole('link', { name: /all requests/i })).toHaveAttribute(
      'href',
      '/admin/orders?tab=requests',
    );
    expect(screen.getByRole('heading', { name: /waiting requests/i })).toBeInTheDocument();
  });
});
