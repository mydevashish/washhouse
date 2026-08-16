import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import {
  PartnerHubServicesAddForm,
  PartnerHubServicesModalContent,
  PartnerHubServicesWorkspaceBody,
  usePartnerHubServicesList,
} from '@/features/partner/orders-hub/workspace/partner-hub-services-workspace';
import { listServiceCategories } from '@/services/customer-experience';
import {
  createPartnerService,
  listPartnerServices,
  updatePartnerService,
} from '@/services/partner-service-catalog';

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/features/partner/components/ops-visual', () => ({
  PartnerOpsSurface: ({ children, ...rest }: { children: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
}));

jest.mock('@/services/customer-experience', () => ({
  listServiceCategories: jest.fn(),
}));

jest.mock('@/services/partner-service-catalog', () => ({
  listPartnerServices: jest.fn(),
  createPartnerService: jest.fn(),
  updatePartnerService: jest.fn(),
  deletePartnerService: jest.fn(),
}));

jest.mock('@/features/partner/orders-hub/workspace/partner-hub-workspace-modal', () => ({
  PartnerHubWorkspaceModalGate: ({
    children,
    toolbar,
    footer,
  }: {
    children: React.ReactNode;
    toolbar?: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div>
      {toolbar}
      {children}
      {footer}
    </div>
  ),
}));

const sampleService = {
  id: 's1',
  name: 'Wash & Fold',
  category: 'wash',
  unit: 'piece',
  price_inr: '49',
  is_active: true,
  description: null,
};

const paginated = (items: typeof sampleService[], total = items.length, page = 1) => ({
  items,
  page,
  page_size: 10,
  total_records: total,
  total_pages: Math.max(1, Math.ceil(total / 10)),
  has_next: page < Math.max(1, Math.ceil(total / 10)),
  has_previous: page > 1,
});

function ServicesBodyProbe() {
  const list = usePartnerHubServicesList();
  return <PartnerHubServicesWorkspaceBody list={list} />;
}

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('PartnerHubServicesWorkspace (Prompt 7)', () => {
  beforeEach(() => {
    jest.mocked(listPartnerServices).mockResolvedValue(paginated([sampleService], 1));
    jest.mocked(listServiceCategories).mockResolvedValue([
      {
        id: 'c1',
        slug: 'wash',
        name: 'Wash',
        description: null,
        icon: null,
        sort_order: 0,
        is_active: true,
      },
    ]);
    jest.mocked(createPartnerService).mockResolvedValue(sampleService);
    jest.mocked(updatePartnerService).mockResolvedValue({ ...sampleService, is_active: false });
  });

  it('creates a service via add form submit', async () => {
    jest.mocked(listPartnerServices).mockResolvedValue(paginated([], 0));
    const user = userEvent.setup();
    render(
      wrap(
        <PartnerHubServicesAddForm
          categoryOptions={[{ slug: 'wash', name: 'Wash' }]}
          categoriesLoading={false}
          onCreateCategory={() => {}}
          onCreated={() => {}}
        />,
      ),
    );

    await user.type(screen.getByLabelText(/service name/i), 'Dry Clean');
    await user.type(screen.getByLabelText(/price \(inr\)/i), '199');
    await user.click(screen.getByTestId('hub-services-add-submit'));

    await waitFor(() => {
      expect(createPartnerService).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dry Clean',
          price_inr: 199,
          category: 'wash',
        }),
      );
    });
  });

  it('toggles service active state', async () => {
    const user = userEvent.setup();
    render(wrap(<ServicesBodyProbe />));

    await waitFor(() => {
      expect(screen.getByTestId('hub-service-toggle-s1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('hub-service-toggle-s1'));

    await waitFor(() => {
      expect(updatePartnerService).toHaveBeenCalledWith('s1', {
        catalog_status: 'paused',
        is_active: false,
      });
    });
  });

  it('filters services via debounced server search', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(wrap(<PartnerHubServicesModalContent />));

    await waitFor(() => {
      expect(screen.getByTestId('hub-services-search')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('hub-services-search'), 'Dry Clean');
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(listPartnerServices).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Dry Clean', page_size: 10 }),
      );
    });

    jest.useRealTimers();
  });

  it('changes page via pagination controls', async () => {
    jest.mocked(listPartnerServices).mockResolvedValue(paginated([sampleService], 15, 1));
    const user = userEvent.setup();
    render(wrap(<PartnerHubServicesModalContent />));

    await waitFor(() => {
      expect(screen.getByTestId('hub-workspace-pagination')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Next page'));

    await waitFor(() => {
      expect(listPartnerServices).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });
});
