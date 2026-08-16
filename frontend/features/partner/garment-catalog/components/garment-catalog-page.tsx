'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { GarmentBulkDeleteDialog } from '@/features/partner/garment-catalog/components/garment-bulk-delete-dialog';
import { GarmentBulkUploadDialog } from '@/features/partner/garment-catalog/components/garment-bulk-upload-dialog';
import { GarmentBulkVisibleDialog } from '@/features/partner/garment-catalog/components/garment-bulk-visible-dialog';
import { GarmentCatalogCategoryTabs } from '@/features/partner/garment-catalog/components/garment-catalog-category-tabs';
import { GarmentDeleteDialog } from '@/features/partner/garment-catalog/components/garment-delete-dialog';
import { GarmentFormSheet } from '@/features/partner/garment-catalog/components/garment-form-sheet';
import { GarmentCatalogKpiStrip } from '@/features/partner/garment-catalog/components/garment-catalog-kpi-strip';
import { GarmentCatalogList } from '@/features/partner/garment-catalog/components/garment-catalog-list';
import { GarmentCatalogToolbar } from '@/features/partner/garment-catalog/components/garment-catalog-toolbar';
import { usePartnerGarmentCatalogMutations } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations';
import {
  usePartnerGarmentCatalogList,
  type GarmentCatalogCategoryFilter,
} from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-list';
import { usePartnerGarmentCatalogKpis } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-summary';
import { nextGarmentVisibility } from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import { downloadGarmentTemplate, type GarmentCatalogItem, type GarmentCategory } from '@/services/partner-garment-catalog';

type FormState =
  | { open: false }
  | { open: true; mode: 'create'; defaultCategory?: GarmentCategory }
  | { open: true; mode: 'edit'; item: GarmentCatalogItem };

export function GarmentCatalogPage() {
  const [category, setCategory] = useState<GarmentCatalogCategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<GarmentCatalogItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkVisibleOpen, setBulkVisibleOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const { updateM, deleteM } = usePartnerGarmentCatalogMutations();

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [category, search]);

  const kpis = usePartnerGarmentCatalogKpis();
  const listQ = usePartnerGarmentCatalogList({ category, search, page });
  const pageItems = listQ.data?.items ?? [];
  const pageIds = pageItems.map((item) => item.id);

  function openBulkDelete() {
    setBulkDeleteOpen(true);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean, pageIds: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  const deleteCategory = category === 'all' ? undefined : category;

  function openBulkUpload() {
    setBulkUploadOpen(true);
  }

  async function handleDownloadTemplate() {
    try {
      await downloadGarmentTemplate();
      toast.success('Template downloaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not download template';
      toast.error(message);
    }
  }

  function openCreate() {
    const defaultCategory = category === 'all' ? undefined : category;
    setFormState({ open: true, mode: 'create', defaultCategory });
  }

  function openEdit(item: GarmentCatalogItem) {
    setFormState({ open: true, mode: 'edit', item });
  }

  async function handleToggleVisibility(item: GarmentCatalogItem) {
    setTogglingId(item.id);
    try {
      await updateM.mutateAsync({
        id: item.id,
        input: { is_visible: nextGarmentVisibility(item.is_visible) },
      });
    } finally {
      setTogglingId(null);
    }
  }

  function handleDeleteRequest(item: GarmentCatalogItem) {
    setFormState({ open: false });
    setDeleteTarget(item);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteM.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setPage(1);
  }

  function openMakeAllVisible() {
    if (pageIds.length === 0) return;
    setBulkVisibleOpen(true);
  }

  return (
    <div className="space-y-4" data-testid="partner-services-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">Service catalog</h1>
          <p className="text-sm text-muted-foreground">
            Your garment list and rates — used at the counter and in orders.
          </p>
        </div>
        <GarmentCatalogToolbar
          onBulkUpload={openBulkUpload}
          onBulkDelete={openBulkDelete}
          onMakeAllVisible={openMakeAllVisible}
          makeAllVisibleDisabled={pageIds.length === 0 || listQ.isLoading || listQ.isPending}
          onAddGarment={openCreate}
        />
      </div>

      <GarmentCatalogKpiStrip
        total={kpis.total}
        visible={kpis.visible}
        categories={kpis.categories}
        loading={kpis.isLoading}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GarmentCatalogCategoryTabs value={category} onChange={setCategory} />
        <Input
          className="h-9 min-h-9 w-full sm:max-w-xs"
          placeholder="Search garment or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="garment-catalog-search"
          aria-label="Search garment or code"
        />
      </div>

      <GarmentCatalogList
        data={listQ.data}
        isLoading={listQ.isLoading}
        isPending={listQ.isPending}
        isError={listQ.isError}
        error={listQ.error}
        category={category}
        search={search}
        togglingId={togglingId}
        onRetry={() => void listQ.refetch()}
        onUpload={openBulkUpload}
        onDownloadTemplate={() => void handleDownloadTemplate()}
        onPageChange={setPage}
        onEdit={openEdit}
        onToggleVisibility={(item) => void handleToggleVisibility(item)}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      <div
        className="rounded-xl border border-border bg-muted/20 px-4 py-3"
        data-testid="garment-catalog-pricing-link"
      >
        <Link
          href="/partner/pricing"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Marketplace garment prices
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Per-garment compare list for customers — separate from your counter rate card.
        </p>
      </div>

      <GarmentBulkUploadDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} />

      <GarmentBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
          if (!open) setSelectedIds(new Set());
        }}
        selectedIds={[...selectedIds]}
        selectedCategory={deleteCategory}
        totalCount={kpis.total}
        onSuccess={() => setPage(1)}
      />

      <GarmentBulkVisibleDialog
        open={bulkVisibleOpen}
        onOpenChange={setBulkVisibleOpen}
        pageIds={pageIds}
      />

      <GarmentFormSheet
        open={formState.open}
        mode={formState.open ? formState.mode : 'create'}
        item={formState.open && formState.mode === 'edit' ? formState.item : null}
        defaultCategory={
          formState.open && formState.mode === 'create' ? formState.defaultCategory : undefined
        }
        onOpenChange={(open) => {
          if (!open) setFormState({ open: false });
        }}
        onDelete={handleDeleteRequest}
      />

      <GarmentDeleteDialog
        item={deleteTarget}
        open={deleteTarget != null}
        deleting={deleteM.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
}
