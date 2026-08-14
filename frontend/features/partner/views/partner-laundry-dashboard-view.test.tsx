import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PartnerDashboardPeriodProvider } from '@/features/partner/dashboard/partner-dashboard-period';
import { PartnerLaundryDashboardView } from '@/features/partner/views/partner-laundry-dashboard-view';
import {
  buildEmptyPartnerDashboardFixture,
  buildPartnerDashboardFixture,
} from '@/features/partner/views/partner-laundry-dashboard-view.test-fixtures';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: () => <div data-testid="revenue-line-chart" />,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

jest.mock('@/features/partner/components/partner-create-order-dialog', () => ({
  PartnerCreateOrderDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="partner-create-order-dialog" /> : null,
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { full_name: string } | null }) => unknown) =>
    selector({ user: { full_name: 'Partner User' } }),
}));

const dashboardRefetch = jest.fn();
let dashboardState: Record<string, unknown> = {};
let ordersState: Record<string, unknown> = {};
let customersState: Record<string, unknown> = {};

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerAnalyticsDashboard: () => dashboardState,
  usePartnerOrders: () => ordersState,
  usePartnerTopCustomers: () => customersState,
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <PartnerDashboardPeriodProvider defaultPeriod="week">{children}</PartnerDashboardPeriodProvider>
    </QueryClientProvider>
  );
}

function setDashboardHappyPath() {
  dashboardState = {
    data: buildPartnerDashboardFixture(),
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: dashboardRefetch,
  };
  ordersState = {
    data: { items: [] },
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: jest.fn(),
  };
  customersState = {
    data: { items: [] },
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: jest.fn(),
  };
}

describe('PartnerLaundryDashboardView', () => {
  beforeEach(() => {
    dashboardRefetch.mockClear();
    setDashboardHappyPath();
  });

  it('renders welcome from API laundry name and wallet not tracked', () => {
    render(wrap(<PartnerLaundryDashboardView />));

    expect(screen.getByRole('heading', { level: 1, name: /welcome, demo laundry/i })).toBeInTheDocument();
    expect(screen.queryByText('#ORD-1256')).not.toBeInTheDocument();
    expect(screen.queryByText('Rahul Sharma')).not.toBeInTheDocument();
    expect(screen.getByText('Not tracked')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all recent orders' })).toHaveAttribute(
      'href',
      '/partner/orders',
    );
    expect(screen.getByRole('link', { name: 'View all Ready for Delivery' })).toHaveAttribute(
      'href',
      '/partner/orders?status=ready',
    );
  });

  it('shows empty recent orders copy without placeholder rows', () => {
    dashboardState = {
      ...dashboardState,
      data: buildEmptyPartnerDashboardFixture(),
    };

    render(wrap(<PartnerLaundryDashboardView />));

    expect(screen.getByText('No recent orders yet.')).toBeInTheDocument();
    expect(screen.getByText('No customers yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week', pressed: true })).toBeInTheDocument();
  });

  it('shows dashboard metrics error with retry', () => {
    dashboardState = {
      data: undefined,
      isLoading: false,
      isPending: false,
      isError: true,
      error: new Error('Network error'),
      isFetching: false,
      refetch: dashboardRefetch,
    };

    render(wrap(<PartnerLaundryDashboardView />));

    expect(screen.getByText('Could not load dashboard metrics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
