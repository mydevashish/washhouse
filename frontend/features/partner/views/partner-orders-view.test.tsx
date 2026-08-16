import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerOrdersView } from '@/features/partner/views/partner-orders-view';

const replace = jest.fn();
const push = jest.fn();
let searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => searchParams,
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/services/partner', () => ({
  listPartnerOrders: jest.fn().mockResolvedValue({
    items: [],
    page: 1,
    page_size: 10,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  }),
}));

jest.mock('@/services/customer-insights', () => ({
  getPartnerCustomerInsightsDashboard: jest.fn().mockResolvedValue({
    total_customers: 12,
    new_this_week: 2,
    orders_count_all_time: 48,
    orders_count_this_week: 5,
    segments: { new: 0, active: 0, vip: 0, at_risk: 0, inactive: 0 },
    lists: { top: 0, repeat: 0, vip: 0, inactive: 0, high_risk: 0 },
    avg_retention_score: '0',
    avg_lifetime_spend_inr: '0',
    avg_order_value_inr: '0',
  }),
  listPartnerCustomerInsights: jest.fn().mockResolvedValue({
    items: [],
    page: 1,
    page_size: 10,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  }),
}));

jest.mock('@/services/partner-coupons', () => ({
  listPartnerCoupons: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/partner-service-catalog', () => ({
  listPartnerServices: jest.fn().mockResolvedValue({
    items: [],
    page: 1,
    page_size: 10,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  }),
  listPartnerServiceCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/features/partner/orders-hub/workspace/partner-hub-orders-workspace', () => ({
  usePartnerHubOrdersList: () => ({
    search: '',
    setSearch: jest.fn(),
    setPage: jest.fn(),
    data: {
      items: [],
      page: 1,
      page_size: 10,
      total_records: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
    isPending: false,
    isError: false,
  }),
  usePartnerHubOrdersKpis: () => ({ needsAction: 0, isLoadingAction: false }),
  PartnerHubOrdersWorkspaceToolbar: () => <div data-testid="hub-orders-toolbar" />,
  PartnerHubOrdersWorkspaceBody: () => <div data-testid="hub-orders-body" />,
}));

jest.mock('@/features/partner/components/partner-orders-table', () => ({
  PartnerOrdersTable: () => <div data-testid="partner-orders-table-mock" />,
}));

jest.mock('@/features/partner/components/partner-create-order-dialog', () => ({
  PartnerCreateOrderDialog: ({
    open,
    initialPhone,
    initialName,
  }: {
    open: boolean;
    initialPhone?: string;
    initialName?: string;
  }) =>
    open ? (
      <div
        data-testid="partner-create-order-dialog"
        data-phone={initialPhone ?? ''}
        data-name={initialName ?? ''}
      />
    ) : null,
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerOrdersView', () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it('opens create dialog from header New order without changing the URL', async () => {
    const user = userEvent.setup();
    render(wrap(<PartnerOrdersView />));

    expect(screen.queryByTestId('partner-create-order-dialog')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('partner-orders-page-new-order'));

    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('opens create dialog from legacy ?tab=create and clears tab from URL', async () => {
    searchParams = new URLSearchParams('tab=create&phone=%2B919876543210&name=Riya');
    const { rerender } = render(wrap(<PartnerOrdersView />));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/partner/orders?phone=%2B919876543210&name=Riya',
        { scroll: false },
      );
    });
    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('partner-create-order-dialog')).toHaveAttribute(
      'data-phone',
      '+919876543210',
    );
    expect(screen.getByTestId('partner-create-order-dialog')).toHaveAttribute(
      'data-name',
      'Riya',
    );

    searchParams = new URLSearchParams('phone=%2B919876543210&name=Riya');
    rerender(wrap(<PartnerOrdersView />));
    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('opens create dialog from ?create=1 bookmark and clears create flag', async () => {
    searchParams = new URLSearchParams('create=1');
    render(wrap(<PartnerOrdersView />));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/partner/orders', { scroll: false });
    });
    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();
  });

  it('opens customers workspace modal from ?workspace=customers', () => {
    searchParams = new URLSearchParams('workspace=customers');
    render(wrap(<PartnerOrdersView />));

    expect(screen.getByTestId('hub-workspace-customers')).toBeInTheDocument();
    expect(screen.getByTestId('hub-customers-search')).toBeInTheDocument();
  });

  it('redirects legacy ?tab=directory to customers workspace', () => {
    searchParams = new URLSearchParams('tab=directory');
    render(wrap(<PartnerOrdersView />));
    expect(replace).toHaveBeenCalledWith('/partner/orders?workspace=customers', { scroll: false });
  });
});
