import {
  PRICE_LIST_CATEGORY_ORDER,
  type CatalogCategory,
} from '@/features/laundry-price-list/types';
import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';

export type PricingFromGroup = {
  category: CatalogCategory;
  items: MarketplaceFromItem[];
  showDryClean: boolean;
  showPress: boolean;
  showSingleRate: boolean;
};

export function groupMarketplaceFromByCategory(
  items: MarketplaceFromItem[],
): PricingFromGroup[] {
  const byCategory = new Map<CatalogCategory, MarketplaceFromItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return PRICE_LIST_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const groupItems = (byCategory.get(category) ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    );
    const showSingleRate = groupItems.some((i) => i.from_price_inr != null);
    const showDryClean = groupItems.some((i) => i.from_dry_clean_inr != null);
    const showPress = groupItems.some((i) => i.from_press_inr != null);
    return { category, items: groupItems, showDryClean, showPress, showSingleRate };
  });
}
