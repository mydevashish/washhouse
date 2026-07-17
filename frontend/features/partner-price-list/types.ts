/** Platform catalog categories for the partner garment price list. */
export type CatalogCategory =
  | 'laundry_by_kg'
  | 'men'
  | 'women'
  | 'kids'
  | 'winter'
  | 'household';

export type CatalogUnit = 'piece' | 'kg' | 'panel' | 'set' | 'pair';

export type PriceMode = 'single' | 'dual' | 'deferred';

export type PartnerPriceListItem = {
  catalog_item_id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  unit: CatalogUnit;
  sort_order: number;
  currency: string;
  suggested_dry_clean_inr: string | null;
  suggested_press_inr: string | null;
  suggested_price_inr: string | null;
  suggested_dry_clean_paise: number | null;
  suggested_press_paise: number | null;
  suggested_price_paise: number | null;
  dry_clean_inr: string | null;
  press_inr: string | null;
  price_inr: string | null;
  dry_clean_paise: number | null;
  press_paise: number | null;
  price_paise: number | null;
  is_offered: boolean | null;
  has_override: boolean;
  allows_press: boolean;
  price_mode: PriceMode;
};

export type PartnerPriceListResponse = {
  items: PartnerPriceListItem[];
  offered_count: number;
  total_catalog_items: number;
};

export type PartnerPriceItemUpsert = {
  catalog_item_id: string;
  dry_clean_inr?: string | null;
  press_inr?: string | null;
  price_inr?: string | null;
  is_offered: boolean;
};

export type ApplySuggestedResult = {
  created: number;
  skipped_existing: number;
  total_active_catalog: number;
};

/** Editable draft row in the partner price editor. */
export type PriceRowDraft = {
  catalog_item_id: string;
  name: string;
  category: CatalogCategory;
  unit: CatalogUnit;
  sort_order: number;
  price_mode: PriceMode;
  allows_press: boolean;
  suggested_dry_clean_inr: string | null;
  suggested_press_inr: string | null;
  suggested_price_inr: string | null;
  dry_clean_inr: string;
  press_inr: string;
  price_inr: string;
  is_offered: boolean;
};

export const PRICE_LIST_CATEGORY_TABS: { id: CatalogCategory; label: string }[] = [
  { id: 'laundry_by_kg', label: 'Wash rates' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
  { id: 'winter', label: 'Winter' },
  { id: 'household', label: 'Household' },
];
