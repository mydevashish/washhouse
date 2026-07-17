import type { PartnerPriceListItem, PriceRowDraft } from '@/features/partner-price-list/types';
import { displayInr } from '@/features/partner-price-list/schemas/price-row';

export function itemToDraft(item: PartnerPriceListItem): PriceRowDraft {
  return {
    catalog_item_id: item.catalog_item_id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    sort_order: item.sort_order,
    price_mode: item.price_mode,
    allows_press: item.allows_press,
    suggested_dry_clean_inr: item.suggested_dry_clean_inr,
    suggested_press_inr: item.suggested_press_inr,
    suggested_price_inr: item.suggested_price_inr,
    dry_clean_inr: displayInr(item.dry_clean_inr),
    press_inr: displayInr(item.press_inr),
    price_inr: displayInr(item.price_inr),
    is_offered: item.is_offered === true,
  };
}

export function itemsToDraftMap(items: PartnerPriceListItem[]): Record<string, PriceRowDraft> {
  return Object.fromEntries(items.map((item) => [item.catalog_item_id, itemToDraft(item)]));
}

export function isDraftDirty(baseline: PriceRowDraft, draft: PriceRowDraft): boolean {
  return (
    baseline.dry_clean_inr !== draft.dry_clean_inr ||
    baseline.press_inr !== draft.press_inr ||
    baseline.price_inr !== draft.price_inr ||
    baseline.is_offered !== draft.is_offered
  );
}

export function collectDirtyDrafts(
  baseline: Record<string, PriceRowDraft>,
  drafts: Record<string, PriceRowDraft>,
): PriceRowDraft[] {
  return Object.values(drafts).filter((draft) => {
    const base = baseline[draft.catalog_item_id];
    return base ? isDraftDirty(base, draft) : true;
  });
}
