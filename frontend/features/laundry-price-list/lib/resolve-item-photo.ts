import type { CatalogCategory } from '@/features/laundry-price-list/types';
import {
  resolveWashhouseCatalogPhoto,
  WASHHOUSE_CATALOG_CATEGORY_HEROES,
  type WashhouseCatalogPhoto,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

/** Catalog tile for a price-list row — product match or category hero when unknown. */
export function resolvePriceListItemPhoto(
  slug: string,
  name: string,
  category: CatalogCategory,
): WashhouseCatalogPhoto {
  return (
    resolveWashhouseCatalogPhoto(slug, name) ??
    WASHHOUSE_CATALOG_CATEGORY_HEROES[category]
  );
}
