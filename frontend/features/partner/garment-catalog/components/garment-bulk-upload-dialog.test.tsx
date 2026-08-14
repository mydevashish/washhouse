import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { GarmentBulkUploadDialog } from '@/features/partner/garment-catalog/components/garment-bulk-upload-dialog';

const previewMock = jest.fn();
const confirmMock = jest.fn();
const listMock = jest.fn();

jest.mock('@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations', () => ({
  usePartnerGarmentCatalogMutations: () => ({
    previewImportM: { mutateAsync: previewMock, isPending: false },
    confirmImportM: { mutateAsync: confirmMock, isPending: false },
  }),
}));

jest.mock('@/services/partner-garment-catalog', () => ({
  downloadGarmentTemplate: jest.fn(),
  listPartnerGarments: (...args: unknown[]) => listMock(...args),
}));

jest.mock('@/features/partner/garment-catalog/lib/garment-import-export', () => ({
  ...jest.requireActual('@/features/partner/garment-catalog/lib/garment-import-export'),
  fetchExistingGarmentCodes: jest.fn().mockResolvedValue(new Set(['tf'])),
}));

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('GarmentBulkUploadDialog', () => {
  beforeEach(() => {
    previewMock.mockReset();
    confirmMock.mockReset();
    listMock.mockReset();
    previewMock.mockResolvedValue({
      preview_id: 'preview-1',
      summary: {
        total_rows: 3,
        valid_count: 2,
        error_count: 1,
        create_count: 1,
        update_count: 1,
      },
      valid_rows: [
        {
          row_number: 2,
          garment_code: 'TF',
          name: 'T Shirt',
          category: 'men',
          is_visible: true,
          rates: { dry_cleaning: 59, steam_press: 15 },
        },
        {
          row_number: 3,
          garment_code: 'JE',
          name: 'Jeans',
          category: 'men',
          is_visible: true,
          rates: { dry_cleaning: 79 },
        },
      ],
      error_rows: [
        {
          row_number: 4,
          garment_code: 'BAD',
          name: 'Broken',
          errors: ['Invalid category'],
        },
      ],
    });
    confirmMock.mockResolvedValue({
      imported_count: 2,
      created_count: 1,
      updated_count: 1,
      skipped_error_count: 1,
    });
  });

  it('previews file and confirms import', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(wrap(<GarmentBulkUploadDialog open onOpenChange={onOpenChange} />));

    const file = new File(['csv'], 'sample.csv', { type: 'text/csv' });
    await user.upload(screen.getByTestId('bulk-upload-file-input'), file);

    await waitFor(() => {
      expect(previewMock).toHaveBeenCalled();
    });

    expect(screen.getByTestId('bulk-upload-summary')).toBeInTheDocument();
    expect(screen.getByTestId('import-row-error-4')).toBeInTheDocument();
    expect(screen.getByTestId('import-row-valid-2')).toBeInTheDocument();

    await user.click(screen.getByTestId('import-confirm-btn'));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith({
        preview_id: 'preview-1',
        mode: 'upsert',
        skip_invalid: true,
      });
    });

    expect(screen.getByTestId('bulk-upload-result')).toBeInTheDocument();
  });
});
