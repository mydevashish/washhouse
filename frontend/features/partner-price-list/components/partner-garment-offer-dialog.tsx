'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  applySuggestedPartnerPrices,
  getPartnerPriceList,
  putPartnerPriceList,
} from '@/features/partner-price-list/api/partner-price-list';
import {
  filterGarmentCatalogItems,
  GARMENT_CATALOG_CATEGORIES,
  type GarmentCatalogCategory,
  upsertPayloadDisableOffer,
  upsertPayloadFromSuggested,
} from '@/features/partner-price-list/lib/quick-offer-garment';
import { displayInr } from '@/features/partner-price-list/schemas/price-row';
import type { PartnerPriceListItem } from '@/features/partner-price-list/types';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<GarmentCatalogCategory, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  winter: 'Winter',
  household: 'Household',
};

function priceSummary(item: PartnerPriceListItem): string {
  if (item.price_mode === 'single') {
    const v = item.price_inr ?? item.suggested_price_inr;
    return v ? `₹${displayInr(v)}` : '—';
  }
  const parts = [
    item.dry_clean_inr ?? item.suggested_dry_clean_inr
      ? `DC ₹${displayInr(item.dry_clean_inr ?? item.suggested_dry_clean_inr)}`
      : null,
    item.allows_press && (item.press_inr ?? item.suggested_press_inr)
      ? `Press ₹${displayInr(item.press_inr ?? item.suggested_press_inr)}`
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

type PartnerGarmentOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after prices change so create-order garment wall can refresh. */
  onSaved?: () => void;
};

export function PartnerGarmentOfferDialog({
  open,
  onOpenChange,
  onSaved,
}: PartnerGarmentOfferDialogProps) {
  const qc = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [category, setCategory] = useState<GarmentCatalogCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: queryKeys.partnerPriceList(),
    queryFn: () => getPartnerPriceList(),
    enabled: enabled && open,
    staleTime: STALE.partnerAnalytics,
  });

  const garmentItems = useMemo(
    () => filterGarmentCatalogItems(listQ.data?.items ?? []),
    [listQ.data?.items],
  );

  const offeredCount = useMemo(
    () => garmentItems.filter((i) => i.is_offered === true).length,
    [garmentItems],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return garmentItems
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.slug.includes(q))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [category, garmentItems, query]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() });
    onSaved?.();
  };

  const applySuggestedM = useMutation({
    mutationFn: applySuggestedPartnerPrices,
    onSuccess: async (result) => {
      toast.success(
        result.created > 0
          ? `Added ${result.created} garment price${result.created === 1 ? '' : 's'} from WashHouse suggestions`
          : 'Suggested prices were already on file — toggle Offered below if needed',
      );
      await invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not apply suggested prices')),
  });

  const offerOneM = useMutation({
    mutationFn: async (item: PartnerPriceListItem) => {
      const payload = upsertPayloadFromSuggested(item);
      if (!payload) throw new Error('No suggested price for this item');
      await putPartnerPriceList([payload]);
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add garment')),
  });

  const removeOneM = useMutation({
    mutationFn: async (item: PartnerPriceListItem) => {
      await putPartnerPriceList([upsertPayloadDisableOffer(item)]);
    },
    onSuccess: async () => {
      toast.message('Garment removed from counter wall');
      await invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update garment')),
  });

  async function handleOffer(item: PartnerPriceListItem) {
    setBusyId(item.catalog_item_id);
    try {
      await offerOneM.mutateAsync(item);
      toast.success(`${item.name} added to garment wall`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(item: PartnerPriceListItem) {
    setBusyId(item.catalog_item_id);
    try {
      await removeOneM.mutateAsync(item);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-4 py-3 sm:px-5">
          <DialogTitle>Add garments</DialogTitle>
          <DialogDescription>
            Turn on items from the WashHouse catalog with your prices. Offered garments show on the
            create-order garment wall and per-piece dry clean picker.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5">
          {listQ.isError ? (
            <QueryErrorState
              title="Could not load garment catalog"
              message={getApiErrorMessage(listQ.error, 'Price list failed to load')}
              onRetry={() => void listQ.refetch()}
              isRetrying={listQ.isFetching}
            />
          ) : null}

          {listQ.isLoading ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading catalog…
            </p>
          ) : null}

          {listQ.data ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  {offeredCount} offered
                </span>
                <span>{garmentItems.length} in catalog</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5 sm:flex-1"
                  disabled={applySuggestedM.isPending}
                  onClick={() => applySuggestedM.mutate()}
                >
                  {applySuggestedM.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : null}
                  Apply all suggested prices
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-9" asChild>
                  <Link href="/partner/pricing" onClick={() => onOpenChange(false)}>
                    Full price editor
                  </Link>
                </Button>
              </div>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shirt, saree, blazer…"
                  className="h-9 pl-9"
                  aria-label="Search garments"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    category === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  All
                </button>
                {GARMENT_CATALOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      category === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                {filtered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No garments match — try another category or search.
                  </li>
                ) : (
                  filtered.map((item) => {
                    const offered = item.is_offered === true;
                    const canOffer = upsertPayloadFromSuggested(item) != null;
                    const rowBusy = busyId === item.catalog_item_id;
                    return (
                      <li
                        key={item.catalog_item_id}
                        className="flex items-center gap-2 px-3 py-2.5 sm:gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {priceSummary(item)}
                          </p>
                        </div>
                        {offered ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${item.name} from garment wall`}
                            disabled={rowBusy}
                            onClick={() => void handleRemove(item)}
                          >
                            {rowBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden />
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0"
                            aria-label={`Add ${item.name} to garment wall`}
                            disabled={!canOffer || rowBusy}
                            title={
                              canOffer
                                ? 'Add to garment wall'
                                : 'No suggested price — set rates in full editor'
                            }
                            onClick={() => void handleOffer(item)}
                          >
                            {rowBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Plus className="h-4 w-4" aria-hidden />
                            )}
                          </Button>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
