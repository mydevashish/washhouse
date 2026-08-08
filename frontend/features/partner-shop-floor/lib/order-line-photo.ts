import {
  resolveWashhouseCatalogPhoto,
  WASHHOUSE_CATALOG_CATEGORY_HEROES,
  type WashhouseCatalogPhoto,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

/** Strip process suffix from walk-in line labels (`Shirt · Dry clean`). */
export function baseServiceName(serviceName: string): string {
  return serviceName.split('·')[0]?.trim() || serviceName.trim();
}

/** Best-effort photo from partner order line `service_name` (no catalog slug on list DTO). */
export function resolveOrderLinePhoto(serviceName: string): WashhouseCatalogPhoto {
  const base = baseServiceName(serviceName);
  return (
    resolveWashhouseCatalogPhoto('', base) ??
    resolveWashhouseCatalogPhoto(base.toLowerCase().replace(/\s+/g, '-'), base) ??
    WASHHOUSE_CATALOG_CATEGORY_HEROES.men
  );
}
