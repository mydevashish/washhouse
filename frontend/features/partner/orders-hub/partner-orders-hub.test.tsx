import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PartnerOrdersHub } from '@/features/partner/orders-hub/partner-orders-hub';

const replace = jest.fn();
const push = jest.fn();
let searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => searchParams,
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
  usePartnerOrders: () => ({
    data: {
      items: [],
      page: 1,
      page_size: 10,
      total_records: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
    isLoading: false,
    isError: false,
  }),
}));

jest.mock('@/features/partner/components/partner-create-order-dialog', () => ({
  PartnerCreateOrderDialog: ({
    open,
  }: {
    open: boolean;
  }) => (open ? <div data-testid="partner-create-order-dialog" /> : null),
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
  createPartnerCustomer: jest.fn(),
}));

jest.mock('@/services/partner-coupons', () => ({
  listPartnerCoupons: jest.fn().mockResolvedValue([
    { id: 'c1', code: 'SAVE10', discount_percent: 10, is_active: true },
  ]),
  createPartnerCoupon: jest.fn(),
  updatePartnerCoupon: jest.fn(),
  deletePartnerCoupon: jest.fn(),
}));

jest.mock('@/services/partner-service-catalog', () => ({
  listPartnerServices: jest.fn().mockResolvedValue([]),
  listPartnerServiceCategories: jest.fn().mockResolvedValue([]),
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
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it('renders only the four pillar tiles (no tabs, queue, or header chrome)', () => {
    render(wrap(<PartnerOrdersHub />));

    expect(screen.getByTestId('partner-orders-hub')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-grid')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-customers')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-orders')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-coupons')).toBeInTheDocument();
    expect(screen.getByTestId('hub-pillar-services')).toBeInTheDocument();

    expect(screen.queryByTestId('orders-hub-tabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('orders-hub-panel-orders')).not.toBeInTheDocument();
    expect(screen.queryByTestId('partner-orders-shortcut-chips')).not.toBeInTheDocument();
    expect(screen.queryByTestId('partner-orders-new-order-fab')).not.toBeInTheDocument();
  });

  it('redirects legacy ?tab=directory to customers workspace', () => {
    searchParams = new URLSearchParams('tab=directory');
    render(wrap(<PartnerOrdersHub />));
    expect(replace).toHaveBeenCalledWith('/partner/orders?workspace=customers', { scroll: false });
  });

  it('opens create dialog from legacy ?tab=create and clears tab from URL', async () => {
    searchParams = new URLSearchParams('tab=create&phone=%2B919876543210');
    const { rerender } = render(wrap(<PartnerOrdersHub />));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/partner/orders?phone=%2B919876543210', {
        scroll: false,
      });
    });
    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();

    searchParams = new URLSearchParams('phone=%2B919876543210');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('partner-create-order-dialog')).toBeInTheDocument();
  });

  it('opens customers workspace modal from pillar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(wrap(<PartnerOrdersHub />));

    await user.click(screen.getByTestId('hub-pillar-customers'));
    expect(replace).toHaveBeenCalledWith('/partner/orders?workspace=customers', { scroll: false });

    searchParams = new URLSearchParams('workspace=customers');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('hub-workspace-customers')).toBeInTheDocument();
  });

  it('opens orders workspace modal from pillar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(wrap(<PartnerOrdersHub />));

    await user.click(screen.getByTestId('hub-pillar-orders'));
    expect(replace).toHaveBeenCalledWith('/partner/orders?workspace=orders', { scroll: false });

    searchParams = new URLSearchParams('workspace=orders');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('hub-workspace-orders')).toBeInTheDocument();
  });

  it('opens coupons workspace modal from pillar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(wrap(<PartnerOrdersHub />));

    await user.click(screen.getByTestId('hub-pillar-coupons'));
    searchParams = new URLSearchParams('workspace=coupons');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('hub-workspace-coupons')).toBeInTheDocument();
  });

  it('opens services workspace modal from pillar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(wrap(<PartnerOrdersHub />));

    await user.click(screen.getByTestId('hub-pillar-services'));
    searchParams = new URLSearchParams('workspace=services');
    rerender(wrap(<PartnerOrdersHub />));
    expect(screen.getByTestId('hub-workspace-services')).toBeInTheDocument();
  });
});
