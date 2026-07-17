'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, ListChecks } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  applySuggestedPartnerPrices,
  getPartnerPriceList,
  putPartnerPriceList,
} from '@/features/partner-price-list/api/partner-price-list';
import { ApplySuggestedDialog } from '@/features/partner-price-list/components/apply-suggested-dialog';
import { PriceListCategoryTabs } from '@/features/partner-price-list/components/price-list-category-tabs';
import { PriceListRow } from '@/features/partner-price-list/components/price-list-row';
import { PriceListSaveBar } from '@/features/partner-price-list/components/price-list-save-bar';
import { collectDirtyDrafts, itemsToDraftMap } from '@/features/partner-price-list/lib/drafts';
import {
  draftsToUpsertPayload,
  validatePriceRowDrafts,
  type PriceRowValidationError,
} from '@/features/partner-price-list/schemas/price-row';
import type { CatalogCategory, PriceRowDraft } from '@/features/partner-price-list/types';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';

function tableHeaders(category: CatalogCategory) {
  if (category === 'laundry_by_kg') {
    return { primary: 'Rate (₹)', secondary: null as string | null };
  }
  return { primary: 'Dry clean (₹)', secondary: 'Press (₹)' };
}

export function PartnerPriceListView() {
  const qc = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [category, setCategory] = useState<CatalogCategory>('laundry_by_kg');
  const [baseline, setBaseline] = useState<Record<string, PriceRowDraft>>({});
  const [drafts, setDrafts] = useState<Record<string, PriceRowDraft>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, PriceRowValidationError>>({});
  const [applyOpen, setApplyOpen] = useState(false);

  const listQ = useQuery({
    queryKey: queryKeys.partnerPriceList(),
    queryFn: () => getPartnerPriceList(),
    enabled,
    staleTime: STALE.partnerAnalytics,
  });

  useEffect(() => {
    if (!listQ.data) return;
    const map = itemsToDraftMap(listQ.data.items);
    setBaseline(map);
    setDrafts(map);
    setFieldErrors({});
  }, [listQ.data]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CatalogCategory, number>> = {};
    for (const item of listQ.data?.items ?? []) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [listQ.data]);

  const categoryItems = useMemo(
    () =>
      Object.values(drafts)
        .filter((d) => d.category === category)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [drafts, category],
  );

  const dirtyDrafts = useMemo(() => collectDirtyDrafts(baseline, drafts), [baseline, drafts]);
  const headers = tableHeaders(category);
  const showDualColumns = category !== 'laundry_by_kg';

  const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() });

  const saveM = useMutation({
    mutationFn: putPartnerPriceList,
    onSuccess: () => {
      toast.success('Price list saved');
      setFieldErrors({});
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save prices')),
  });

  const applyM = useMutation({
    mutationFn: applySuggestedPartnerPrices,
    onSuccess: (result) => {
      toast.success(
        result.created > 0
          ? `Applied suggested prices to ${result.created} items`
          : 'Suggested prices already applied — nothing new to copy',
      );
      setApplyOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not apply suggested prices')),
  });

  const updateDraft = (next: PriceRowDraft) => {
    setDrafts((prev) => ({ ...prev, [next.catalog_item_id]: next }));
    setFieldErrors((prev) => {
      if (!(next.catalog_item_id in prev)) return prev;
      const copy = { ...prev };
      delete copy[next.catalog_item_id];
      return copy;
    });
  };

  const handleSave = () => {
    const errors = validatePriceRowDrafts(dirtyDrafts);
    if (errors.length > 0) {
      setFieldErrors(Object.fromEntries(errors.map((e) => [e.catalog_item_id, e])));
      toast.error(errors[0]?.message ?? 'Fix validation errors before saving');
      return;
    }
    saveM.mutate(draftsToUpsertPayload(dirtyDrafts));
  };

  const handleDiscard = () => {
    setDrafts(baseline);
    setFieldErrors({});
  };

  return (
    <PartnerContent className={dirtyDrafts.length > 0 ? 'space-y-6 pb-28 md:pb-6' : 'space-y-6'}>
      <PartnerPageHeader
        title="Garment price list"
        description="Set dry-clean and press rates customers see on your store. Separate from service offerings used for walk-in booking."
        actions={
          <Button type="button" variant="outline" onClick={() => setApplyOpen(true)}>
            Apply suggested WashHouse prices
          </Button>
        }
      />

      <InfoBanner icon={IndianRupee} title="Your prices, your positioning">
        Your prices are what customers see. Lower rates can attract more bookings; higher rates can
        signal premium care.
      </InfoBanner>

      {listQ.isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading price list">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      )}

      {listQ.isError && (
        <QueryErrorState
          title="Could not load price list"
          message={getApiErrorMessage(listQ.error)}
          onRetry={() => void listQ.refetch()}
          isRetrying={listQ.isFetching}
        />
      )}

      {!listQ.isLoading && !listQ.isError && listQ.data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4" aria-hidden />
            <span>
              {listQ.data.offered_count} of {listQ.data.total_catalog_items} items offered
            </span>
          </div>

          <PriceListCategoryTabs active={category} onChange={setCategory} counts={categoryCounts} />

          {categoryItems.length === 0 ? (
            <EmptyState
              icon={IndianRupee}
              title="No items in this category"
              description="The platform catalog for this category is empty. Try another tab or ask admin to seed the WashHouse list."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden" role="list" aria-label={`${category} prices`}>
                {categoryItems.map((draft) => (
                  <PriceListRow
                    key={draft.catalog_item_id}
                    draft={draft}
                    variant="mobile"
                    errorField={fieldErrors[draft.catalog_item_id]?.field}
                    onChange={updateDraft}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-border/60 md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5" colSpan={showDualColumns ? 1 : 2}>
                        {headers.primary}
                      </th>
                      {showDualColumns && headers.secondary && (
                        <th className="px-4 py-2.5">{headers.secondary}</th>
                      )}
                      <th className="px-4 py-2.5 text-right">Offered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {categoryItems.map((draft) => (
                      <PriceListRow
                        key={draft.catalog_item_id}
                        draft={draft}
                        variant="desktop"
                        errorField={fieldErrors[draft.catalog_item_id]?.field}
                        onChange={updateDraft}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <PriceListSaveBar
            dirtyCount={dirtyDrafts.length}
            isSaving={saveM.isPending}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </>
      )}

      <ApplySuggestedDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        onConfirm={() => applyM.mutate()}
        isPending={applyM.isPending}
      />
    </PartnerContent>
  );
}
