import type { PartnerPriceItemUpsert, PartnerPriceListItem } from '@/features/partner-price-list/types';

/** Garment-wall categories (excludes wash-by-kg). */
export const GARMENT_CATALOG_CATEGORIES = [
  'men',
  'women',
  'kids',
  'winter',
  'household',
] as const;

export type GarmentCatalogCategory = (typeof GARMENT_CATALOG_CATEGORIES)[number];

export function isGarmentCatalogCategory(
  category: PartnerPriceListItem['category'],
): category is GarmentCatalogCategory {
  return (GARMENT_CATALOG_CATEGORIES as readonly string[]).includes(category);
}

export function filterGarmentCatalogItems(items: PartnerPriceListItem[]): PartnerPriceListItem[] {
  return items.filter(
    (item) => isGarmentCatalogCategory(item.category) && item.price_mode !== 'deferred',
  );
}

/** Build a single upsert that turns on Offered using suggested (or existing) rates. */
export function upsertPayloadFromSuggested(
  item: PartnerPriceListItem,
): PartnerPriceItemUpsert | null {
  if (item.price_mode === 'deferred') return null;

  if (item.price_mode === 'single') {
    const price = item.price_inr ?? item.suggested_price_inr;
    if (!price) return null;
    return {
      catalog_item_id: item.catalog_item_id,
      price_inr: price,
      is_offered: true,
    };
  }

  const dry = item.dry_clean_inr ?? item.suggested_dry_clean_inr;
  const press = item.allows_press ? item.press_inr ?? item.suggested_press_inr : null;
  if (!dry && !press) return null;

  return {
    catalog_item_id: item.catalog_item_id,
    dry_clean_inr: dry,
    press_inr: press,
    is_offered: true,
  };
}

export function upsertPayloadDisableOffer(item: PartnerPriceListItem): PartnerPriceItemUpsert {
  if (item.price_mode === 'single') {
    return {
      catalog_item_id: item.catalog_item_id,
      price_inr: item.price_inr ?? item.suggested_price_inr,
      is_offered: false,
    };
  }
  return {
    catalog_item_id: item.catalog_item_id,
    dry_clean_inr: item.dry_clean_inr ?? item.suggested_dry_clean_inr,
    press_inr: item.allows_press ? item.press_inr ?? item.suggested_press_inr : null,
    is_offered: false,
  };
}
