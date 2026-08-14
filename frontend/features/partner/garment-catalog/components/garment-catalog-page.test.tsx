import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { GarmentCatalogPage } from '@/features/partner/garment-catalog/components/garment-catalog-page';

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-summary', () => ({
  usePartnerGarmentCatalogKpis: () => ({
    total: 12,
    visible: 9,
    categories: 4,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-list', () => ({
  usePartnerGarmentCatalogList: () => ({
    data: {
      items: [],
      total_records: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations', () => ({
  usePartnerGarmentCatalogMutations: () => ({
    createM: { mutateAsync: jest.fn(), isPending: false },
    updateM: { mutateAsync: jest.fn(), isPending: false },
    deleteM: { mutateAsync: jest.fn(), isPending: false },
    previewImportM: { mutateAsync: jest.fn(), isPending: false },
    bulkDeleteM: { mutateAsync: jest.fn(), isPending: false },
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

describe('GarmentCatalogPage', () => {
  it('renders header, KPI strip, toolbar, tabs, and search', () => {
    render(wrap(<GarmentCatalogPage />));

    expect(screen.getByTestId('partner-services-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /service catalog/i })).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-kpi-strip')).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-template-btn')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-delete-btn')).toBeInTheDocument();
    expect(screen.getByTestId('add-garment-btn')).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-category-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-search')).toBeInTheDocument();
    expect(screen.getByTestId('garment-catalog-empty')).toBeInTheDocument();
  });
});
