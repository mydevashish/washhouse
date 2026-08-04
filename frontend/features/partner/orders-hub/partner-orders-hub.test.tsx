import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerOrdersHub } from '@/features/partner/orders-hub/partner-orders-hub';

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  useSearchParams: () => searchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
  usePartnerOrders: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock('@/features/partner/booking-requests/hooks', () => ({
  usePartnerBookingRequestsBadge: () => ({
    isLoading: false,
    data: {
      items: [],
      page: 1,
      page_size: 1,
      total: 4,
      total_pages: 1,
      has_next: false,
      has_previous: false,
      inbox: { overdue: 1, new: 0, reviewing: 0 },
    },
  }),
}));

jest.mock('@/features/partner/orders-hub/partner-orders-today-panel', () => ({
  PartnerOrdersTodayPanel: () => <div data-testid="partner-orders-today-panel">today</div>,
}));

jest.mock('@/features/partner/components/partner-orders-table', () => ({
  PartnerOrdersTable: () => <div data-testid="partner-orders-table">orders table</div>,
}));

jest.mock('@/features/partner/customer-desk', () => ({
  PartnerCustomerDeskView: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="partner-customer-desk-view">{embedded ? 'embedded desk' : 'desk'}</div>
  ),
}));

jest.mock('@/features/partner/booking-requests', () => ({
  PartnerBookingRequestsInbox: () => (
    <div data-testid="partner-booking-requests">booking requests</div>
  ),
}));

jest.mock('@/features/partner/views/partner-customers-view', () => ({
  PartnerCustomersView: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="partner-customers-view">{embedded ? 'embedded insights' : 'insights'}</div>
  ),
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerOrdersHub', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams();
  });

  it('renders four hub tabs and defaults to the orders panel', () => {
    render(wrap(<PartnerOrdersHub />));

    expect(screen.getByTestId('orders-hub-tabs')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /today \/ orders/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /find customer/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /directory/i })).toBeInTheDocument();

    expect(screen.getByTestId('orders-hub-panel-orders')).toBeInTheDocument();
    expect(screen.getByTestId('partner-orders-today-panel')).toBeInTheDocument();
  });

  it('falls unknown tab values back to orders', () => {
    searchParams = new URLSearchParams('tab=place-order');
    render(wrap(<PartnerOrdersHub />));

    expect(screen.getByRole('tab', { name: /today \/ orders/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('orders-hub-panel-orders')).toBeInTheDocument();
  });

  it('mounts desk, requests, and directory panels from ?tab=', () => {
    searchParams = new URLSearchParams('tab=desk');
    const { rerender } = render(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-desk')).toBeInTheDocument();
    expect(screen.getByTestId('partner-customer-desk-view')).toHaveTextContent('embedded desk');

    searchParams = new URLSearchParams('tab=requests');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-requests')).toBeInTheDocument();

    searchParams = new URLSearchParams('tab=directory');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-directory')).toBeInTheDocument();
    expect(screen.getByTestId('partner-customers-view')).toHaveTextContent('embedded insights');
  });

  it('shows requests badge on the hub header and Requests tab', () => {
    render(wrap(<PartnerOrdersHub />));

    expect(screen.getByTestId('orders-hub-header-requests-badge')).toHaveTextContent('4');
    expect(screen.getByTestId('orders-hub-tab-badge-requests')).toHaveTextContent('4');
  });

  it('switches tabs via URL replace', async () => {
    const user = userEvent.setup();
    render(wrap(<PartnerOrdersHub />));

    await user.click(screen.getByRole('tab', { name: /find customer/i }));
    expect(replace).toHaveBeenCalledWith('/partner/orders?tab=desk', { scroll: false });
  });
});
