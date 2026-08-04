import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { AdminOrdersHub } from '@/features/admin/orders-hub/admin-orders-hub';

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

jest.mock('@/features/admin/booking-requests/hooks', () => ({
  useAdminBookingRequestsList: () => ({
    isLoading: false,
    data: {
      items: [],
      page: 1,
      page_size: 1,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
      inbox: { new: 3, reviewing: 2 },
    },
  }),
}));

jest.mock('@/features/admin/orders-hub/admin-orders-today-panel', () => ({
  AdminOrdersTodayPanel: () => <div data-testid="admin-orders-today-panel">today</div>,
}));

jest.mock('@/features/admin/admin-orders-table', () => ({
  AdminOrdersTable: () => <div data-testid="admin-orders-table">orders table</div>,
}));

jest.mock('@/features/admin/customer-desk', () => ({
  CustomerDeskView: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="customer-desk-view">{embedded ? 'embedded desk' : 'desk'}</div>
  ),
}));

jest.mock('@/features/admin/booking-requests', () => ({
  AdminBookingRequestsDatatable: () => (
    <div data-testid="admin-booking-requests">booking requests</div>
  ),
}));

jest.mock('@/features/admin/views/admin-customers-view', () => ({
  AdminCustomersView: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="admin-customers-view">{embedded ? 'embedded customers' : 'customers'}</div>
  ),
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AdminOrdersHub', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams();
  });

  it('renders four hub tabs and defaults to the orders panel', () => {
    render(wrap(<AdminOrdersHub />));

    expect(screen.getByTestId('orders-hub-tabs')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /today \/ orders/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /find customer/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /directory/i })).toBeInTheDocument();

    expect(screen.getByTestId('orders-hub-panel-orders')).toBeInTheDocument();
    expect(screen.getByTestId('admin-orders-today-panel')).toBeInTheDocument();
    expect(screen.getByTestId('admin-orders-table')).toBeInTheDocument();
  });

  it('falls unknown tab values back to orders', () => {
    searchParams = new URLSearchParams('tab=place-order');
    render(wrap(<AdminOrdersHub />));

    expect(screen.getByRole('tab', { name: /today \/ orders/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('orders-hub-panel-orders')).toBeInTheDocument();
  });

  it('mounts desk, requests, and directory panels from ?tab=', () => {
    searchParams = new URLSearchParams('tab=desk');
    const { rerender } = render(wrap(<AdminOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-desk')).toBeInTheDocument();
    expect(screen.getByTestId('customer-desk-view')).toHaveTextContent('embedded desk');

    searchParams = new URLSearchParams('tab=requests');
    rerender(wrap(<AdminOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-requests')).toBeInTheDocument();

    searchParams = new URLSearchParams('tab=directory');
    rerender(wrap(<AdminOrdersHub />));
    expect(screen.getByTestId('orders-hub-panel-directory')).toBeInTheDocument();
    expect(screen.getByTestId('admin-customers-view')).toHaveTextContent('embedded customers');
  });

  it('shows requests badge on the hub header and Requests tab', () => {
    render(wrap(<AdminOrdersHub />));

    expect(screen.getByTestId('orders-hub-header-requests-badge')).toHaveTextContent('5');
    expect(screen.getByTestId('orders-hub-tab-badge-requests')).toHaveTextContent('5');
  });

  it('switches tabs via URL replace', async () => {
    const user = userEvent.setup();
    render(wrap(<AdminOrdersHub />));

    await user.click(screen.getByRole('tab', { name: /find customer/i }));
    expect(replace).toHaveBeenCalledWith('/admin/orders?tab=desk', { scroll: false });
  });
});
