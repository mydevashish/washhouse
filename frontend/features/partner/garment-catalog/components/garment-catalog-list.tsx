'use client';

import { Loader2, Shirt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { GarmentCatalogGrid } from '@/features/partner/garment-catalog/components/garment-catalog-grid';
import { GarmentCatalogTable } from '@/features/partner/garment-catalog/components/garment-catalog-table';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual';
import { PartnerHubWorkspacePagination } from '@/features/partner/orders-hub/workspace/partner-hub-workspace-pagination';
import { partnerHubPaginationFromList } from '@/features/partner/orders-hub/workspace/partner-hub-workspace-pagination';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { GarmentCatalogItem, PaginatedGarmentCatalog } from '@/services/partner-garment-catalog';

export function GarmentCatalogList({
  data,
  isLoading,
  isError,
  error,
  togglingId,
  onRetry,
  onUpload,
  onDownloadTemplate,
  onPageChange,
  onEdit,
  onToggleVisibility,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  data?: PaginatedGarmentCatalog;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  togglingId?: string | null;
  onRetry: () => void;
  onUpload: () => void;
  onDownloadTemplate: () => void;
  onPageChange: (page: number) => void;
  onEdit: (item: GarmentCatalogItem) => void;
  onToggleVisibility: (item: GarmentCatalogItem) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean, pageIds: string[]) => void;
}) {
  if (isError) {
    return (
      <QueryErrorState
        title="Could not load garment catalog"
        message={getApiErrorMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  if (isLoading && !data) {
    return (
      <PartnerOpsSurface className="flex min-h-[12rem] items-center justify-center" variant="flush">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading catalog" />
      </PartnerOpsSurface>
    );
  }

  const items = data?.items ?? [];

  if (!isLoading && items.length === 0) {
    return (
      <div className="space-y-3" data-testid="garment-catalog-empty">
        <EmptyState
          icon={Shirt}
          title="No garments yet"
          description="Upload your rate card from Excel or download our template — same columns as your POS export."
          secondaryAction={{ label: 'Upload rate card', onClick: onUpload }}
        />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={onDownloadTemplate}>
            Download template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PartnerOpsSurface className="overflow-hidden !p-0 sm:!p-3" variant="flush" data-testid="garment-catalog-list">
      <GarmentCatalogGrid
        items={items}
        togglingId={togglingId}
        onEdit={onEdit}
        onToggleVisibility={onToggleVisibility}
      />
      <GarmentCatalogTable
        items={items}
        togglingId={togglingId}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={(checked) => onToggleSelectAll(checked, items.map((item) => item.id))}
        onEdit={onEdit}
        onToggleVisibility={onToggleVisibility}
      />

      {data && data.total_records > 0 ? (
        <PartnerHubWorkspacePagination
          {...partnerHubPaginationFromList(data)}
          onPageChange={onPageChange}
        />
      ) : null}
    </PartnerOpsSurface>
  );
}
