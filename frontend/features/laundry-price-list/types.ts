/** Public laundry garment price list (customer-facing). */

export type CatalogCategory =
  | 'laundry_by_kg'
  | 'men'
  | 'women'
  | 'kids'
  | 'winter'
  | 'household';

export type CatalogUnit = 'piece' | 'kg' | 'panel' | 'set' | 'pair';

export type PriceMode = 'single' | 'dual' | 'deferred';

export type LaundryPriceListItem = {
  catalog_item_id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  unit: CatalogUnit;
  sort_order: number;
  currency: string;
  price_mode: PriceMode;
  dry_clean_inr: string | null;
  press_inr: string | null;
  price_inr: string | null;
  dry_clean_paise: number | null;
  press_paise: number | null;
  price_paise: number | null;
};

export type LaundryPriceListResponse = {
  laundry_id: string;
  items: LaundryPriceListItem[];
  item_count: number;
  has_published_list: boolean;
};

export const PRICE_LIST_CATEGORY_ORDER: CatalogCategory[] = [
  'laundry_by_kg',
  'men',
  'women',
  'kids',
  'winter',
  'household',
];

export const PRICE_LIST_CATEGORY_LABELS: Record<CatalogCategory, string> = {
  laundry_by_kg: 'Wash rates (by kg)',
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  winter: 'Winter',
  household: 'Household',
};
