import type { WashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import {
  resolveWashhouseCatalogPhoto,
  WASHHOUSE_CATALOG_PHOTOS,
  WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS,
} from '@/features/marketing/catalog/washhouse-catalog-photos';
import { normalizeServiceCategory } from '@/features/discover/detail/lib/normalize-service-category';

const SERVICE_CATEGORY_PHOTOS: Record<string, WashhouseCatalogPhoto> = {
  wash: WASHHOUSE_CATALOG_PHOTOS.wash_fold,
  'wash-iron': WASHHOUSE_CATALOG_PHOTOS.wash_fold,
  iron: WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.steam_ironing,
  'dry-clean': WASHHOUSE_CATALOG_PHOTOS.shirt,
  'premium-care': WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.professional_cleaning,
  'home-linen': WASHHOUSE_CATALOG_PHOTOS.bedsheet,
  specialty: WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.curtain,
  special: WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.curtain,
};

function slugifyServiceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Garment / service tile for storefront cards — name match, else category hero. */
export function resolveServicePhoto(
  name: string,
  category: string,
): WashhouseCatalogPhoto {
  const byName = resolveWashhouseCatalogPhoto(slugifyServiceName(name), name);
  if (byName) return byName;

  const key = normalizeServiceCategory(category);
  return SERVICE_CATEGORY_PHOTOS[key] ?? WASHHOUSE_CATALOG_PHOTOS.wash_fold;
}
