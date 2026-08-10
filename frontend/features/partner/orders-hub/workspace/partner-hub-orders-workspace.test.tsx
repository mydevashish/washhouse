import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import {
  PartnerHubOrdersWorkspaceToolbar,
  usePartnerHubOrdersList,
} from '@/features/partner/orders-hub/workspace/partner-hub-orders-workspace';
import { listPartnerOrders } from '@/services/partner';

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
  usePartnerOrders: () => ({
    data: { total_records: 2, items: [], page: 1, page_size: 1, total_pages: 2, has_next: true, has_previous: false },
    isLoading: false,
  }),
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

function ListProbe() {
  const list = usePartnerHubOrdersList();
  return (
    <div>
      <PartnerHubOrdersWorkspaceToolbar
        searchInput={list.search}
        onSearchChange={list.setSearch}
        onNewOrder={() => {}}
      />
      {list.data ? (
        <div data-testid="hub-workspace-pagination">page {list.data.page}</div>
      ) : null}
    </div>
  );
}

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerHubOrdersWorkspace (Prompt 4)', () => {
  beforeEach(() => {
    jest.mocked(listPartnerOrders).mockClear();
  });

  it('renders search and debounces listPartnerOrders calls', async () => {
    render(wrap(<ListProbe />));

    expect(screen.getByTestId('hub-orders-search')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('hub-workspace-pagination')).toBeInTheDocument();
    });

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(screen.getByTestId('hub-orders-search'), '9876');
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(listPartnerOrders).toHaveBeenCalled();
      const last = jest.mocked(listPartnerOrders).mock.calls.at(-1)?.[0];
      expect(last?.search).toBe('9876');
      expect(last?.page_size).toBe(10);
      expect(last?.bucket).toBe('all');
    });

    jest.useRealTimers();
  });
});
