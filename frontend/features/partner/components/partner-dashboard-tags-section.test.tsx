import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { PartnerDashboardTagsSection } from '@/features/partner/components/partner-dashboard-tags-section';
import type { PartnerOrder } from '@/services/partner';
import { getPartnerOrderTags } from '@/services/partner-order-tags';

const mockUsePartnerTagsOrderSearch = jest.fn();

jest.mock('@/features/partner/hooks/use-partner-tags-order-search', () => ({
  usePartnerTagsOrderSearch: (raw: string) => mockUsePartnerTagsOrderSearch(raw),
}));

jest.mock('@/services/partner-order-tags', () => ({
  getPartnerOrderTags: jest.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

const baseOrder = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  tracking_code: 'WH-TAGS-001',
  token_code: 'R-42',
  color_token: 'red',
  customer_name: 'Counter Test',
  customer_phone: '+919876543210',
  status: 'processing',
} as PartnerOrder;

function mockSearchReturn(overrides: Record<string, unknown> = {}) {
  mockUsePartnerTagsOrderSearch.mockReturnValue({
    search: '',
    shouldSearch: false,
    orders: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isFetching: false,
    ...overrides,
  });
}

function renderTagsSection(ui: ReactNode = <PartnerDashboardTagsSection />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('PartnerDashboardTagsSection', () => {
  beforeEach(() => {
    mockSearchReturn();
  });

  it('renders idle state with searchable input', () => {
    renderTagsSection();

    expect(screen.getByTestId('partner-dashboard-tags')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByTestId('partner-dashboard-tags-search')).toBeInTheDocument();
    expect(screen.getByTestId('partner-dashboard-tags-idle')).toBeInTheDocument();
    expect(screen.getByTestId('partner-dashboard-tags-open-print-center')).toHaveAttribute(
      'href',
      '/partner/floor/print',
    );
  });

  it('shows result row with print tags link when search returns orders', async () => {
    mockSearchReturn({
      search: 'WH-TAGS',
      shouldSearch: true,
      orders: [baseOrder],
    });

    renderTagsSection();
    const user = userEvent.setup();
    await user.type(screen.getByTestId('partner-dashboard-tags-search'), 'WH-TAGS');

    expect(screen.getByTestId('partner-dashboard-tags-result')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /print tags/i })).toHaveAttribute(
      'href',
      '/partner/floor/print/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/tags',
    );
  });

  it('verify tags expands panel and loads tag preview', async () => {
    jest.mocked(getPartnerOrderTags).mockResolvedValue({
      order_id: baseOrder.id,
      laundry_id: 'l1',
      laundry_name: 'Test Laundry',
      color_token: 'red',
      token_code: 'R-42',
      token_day_number: 42,
      token_assigned_on: '2026-08-10',
      customer_name: 'Counter Test',
      customer_phone: '+919876543210',
      customer_phone_last4: '3210',
      tracking_code: 'WH-TAGS-001',
      piece_count: 2,
      line_count: 1,
      created_at: '2026-08-10T00:00:00Z',
      per_piece: false,
      tags: [
        { kind: 'bag_master', label: 'Bag', quantity: 1 },
        { kind: 'item', label: 'Shirt · Wash', quantity: 2, qty_index: '1/2' },
      ],
    });

    mockSearchReturn({
      search: 'R-42',
      shouldSearch: true,
      orders: [baseOrder],
    });

    renderTagsSection();
    const user = userEvent.setup();
    await user.type(screen.getByTestId('partner-dashboard-tags-search'), 'R-42');
    await user.click(screen.getByRole('button', { name: 'Verify tags' }));

    expect(
      screen.getByTestId('partner-dashboard-tags-verify-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('partner-dashboard-tags-verify-bag-master')).not.toBeInTheDocument();
    expect(screen.queryByText('Bag master')).not.toBeInTheDocument();
    expect(screen.queryByText('Garment tag')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open full print view/i })).toHaveAttribute(
      'href',
      '/partner/floor/print/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/tags',
    );
    expect(getPartnerOrderTags).toHaveBeenCalledWith(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      expect.objectContaining({ perPiece: expect.any(Boolean) }),
    );
  });
});
