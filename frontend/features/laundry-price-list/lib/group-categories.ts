import {
  PRICE_LIST_CATEGORY_ORDER,
  type CatalogCategory,
  type LaundryPriceListItem,
} from '@/features/laundry-price-list/types';

export type CategoryGroup = {
  category: CatalogCategory;
  items: LaundryPriceListItem[];
  showDryClean: boolean;
  showPress: boolean;
  showSingleRate: boolean;
};

export function groupPriceListByCategory(items: LaundryPriceListItem[]): CategoryGroup[] {
  const byCategory = new Map<CatalogCategory, LaundryPriceListItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return PRICE_LIST_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const groupItems = (byCategory.get(category) ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    );
    const showSingleRate = groupItems.some((i) => i.price_inr != null);
    const showDryClean = groupItems.some((i) => i.dry_clean_inr != null);
    const showPress = groupItems.some((i) => i.press_inr != null);
    return { category, items: groupItems, showDryClean, showPress, showSingleRate };
  });
}
