/** Marketplace “from ₹” types for marketing /pricing. */

import type { CatalogCategory, CatalogUnit, PriceMode } from '@/features/laundry-price-list/types';

export type MarketplaceFromSource = 'aggregate' | 'suggested';

export type MarketplaceFromItem = {
  catalog_item_id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  unit: CatalogUnit;
  sort_order: number;
  currency: string;
  price_mode: PriceMode | string;
  source: MarketplaceFromSource;
  from_dry_clean_inr: string | null;
  from_press_inr: string | null;
  from_price_inr: string | null;
  from_dry_clean_paise: number | null;
  from_press_paise: number | null;
  from_price_paise: number | null;
};

export type MarketplaceFromResponse = {
  items: MarketplaceFromItem[];
  item_count: number;
};
