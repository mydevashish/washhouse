import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { GarmentCatalogPage } from '@/features/partner/garment-catalog/components/garment-catalog-page';

const mockBulkVisible = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const SAMPLE_ITEMS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    laundry_id: '22222222-2222-4222-8222-222222222222',
    category: 'men' as const,
    name: 'T Shirt',
    garment_code: 'TF',
    image_url: null,
    resolved_image_url: null,
    platform_catalog_item_id: null,
    is_visible: false,
    sort_order: 0,
    rates: { dry_cleaning: { price_inr: '59.00', price_paise: 5900 } },
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    laundry_id: '22222222-2222-4222-8222-222222222222',
    category: 'men' as const,
    name: 'Jeans',
    garment_code: 'Je',
    image_url: null,
    resolved_image_url: null,
    platform_catalog_item_id: null,
    is_visible: true,
    sort_order: 1,
    rates: { dry_cleaning: { price_inr: '79.00', price_paise: 7900 } },
  },
];

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-summary', () => ({
  usePartnerGarmentCatalogKpis: () => ({
    total: 2,
    visible: 1,
    categories: 1,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-list', () => ({
  usePartnerGarmentCatalogList: () => ({
    data: {
      items: SAMPLE_ITEMS,
      total_records: 2,
      page: 1,
      page_size: 10,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations', () => ({
  usePartnerGarmentCatalogMutations: () => ({
    createM: { mutateAsync: jest.fn(), isPending: false },
    updateM: { mutateAsync: mockUpdate, isPending: false },
    deleteM: { mutateAsync: mockDelete, isPending: false },
    previewImportM: { mutateAsync: jest.fn(), isPending: false },
    bulkDeleteM: { mutateAsync: jest.fn(), isPending: false },
    bulkVisibleM: { mutateAsync: mockBulkVisible, isPending: false },
    invalidateCatalog: jest.fn(),
  }),
}));

jest.mock('@/features/partner/garment-catalog/components/garment-bulk-delete-dialog', () => ({
  GarmentBulkDeleteDialog: () => null,
}));

jest.mock('@/features/partner/garment-catalog/components/garment-bulk-upload-dialog', () => ({
  GarmentBulkUploadDialog: () => null,
}));

jest.mock('@/features/partner/garment-catalog/components/garment-form-sheet', () => ({
  GarmentFormSheet: () => null,
}));

jest.mock('@/features/partner/garment-catalog/components/garment-delete-dialog', () => ({
  GarmentDeleteDialog: () => null,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

jest.mock('@/services/partner-garment-catalog', () => ({
  downloadGarmentTemplate: jest.fn(),
  GARMENT_CATEGORIES: [
    { id: 'men', label: 'Men' },
    { id: 'women', label: 'Women' },
  ],
  GARMENT_SERVICE_TYPES: ['dry_cleaning', 'steam_press'],
  GARMENT_PRIMARY_SERVICE_TYPES: ['dry_cleaning', 'steam_press'],
  garmentServiceTypeLabel: (t: string) => t,
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('GarmentCatalogPage interactions', () => {
  beforeEach(() => {
    mockBulkVisible.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockBulkVisible.mockResolvedValue({ updated_count: 1 });
  });

  it('toggleSelectAll selects only current page garment ids', () => {
    render(wrap(<GarmentCatalogPage />));

    const selectAll = screen.getByTestId('garment-catalog-select-all');
    expect(selectAll).toHaveAttribute('aria-label', 'Select all on this page');
    expect(screen.getByText('Select all on this page')).toBeInTheDocument();

    fireEvent.click(selectAll);

    expect(screen.getByTestId('garment-select-TF')).toBeChecked();
    expect(screen.getByTestId('garment-select-Je')).toBeChecked();

    fireEvent.click(selectAll);

    expect(screen.getByTestId('garment-select-TF')).not.toBeChecked();
    expect(screen.getByTestId('garment-select-Je')).not.toBeChecked();
  });

  it('make all visible confirms bulk PATCH for current page ids', async () => {
    render(wrap(<GarmentCatalogPage />));

    fireEvent.click(screen.getByTestId('make-all-visible-btn'));
    expect(screen.getByTestId('bulk-visible-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Make 2 garments visible on this page/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('bulk-visible-confirm-btn'));

    await waitFor(() => {
      expect(mockBulkVisible).toHaveBeenCalledWith({
        ids: SAMPLE_ITEMS.map((item) => item.id),
      });
    });
  });
});

describe('GarmentCatalogPage shell', () => {
  it('renders toolbar with all visible action', () => {
    render(wrap(<GarmentCatalogPage />));
    expect(screen.getByTestId('make-all-visible-btn')).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-list')).toBeInTheDocument();
  });
});
