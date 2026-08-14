import { resolveGarmentCatalogPhoto } from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import type { PartnerPriceListItem } from '@/features/partner-price-list/types';
import { resolvePriceListItemPhoto } from '@/features/laundry-price-list/lib/resolve-item-photo';
import type { WashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import {
  resolveWashhouseCatalogPhoto,
  WASHHOUSE_CATALOG_CATEGORY_HEROES,
} from '@/features/marketing/catalog/washhouse-catalog-photos';
import { garmentDisplayLabel } from '@/features/partner-shop-floor/lib/garment-labels';
import type { ClothWallProcess } from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import type { GarmentCatalogItem, GarmentCategory } from '@/services/partner-garment-catalog';
import type { ServiceCatalogItem } from '@/services/customer-experience';

export type ClothWallCategoryChip =
  | 'men'
  | 'women'
  | 'kids'
  | 'winter'
  | 'household';

export const CLOTH_WALL_CATEGORY_CHIPS: {
  id: ClothWallCategoryChip;
  label: string;
  english: string;
}[] = [
  { id: 'men', label: 'Men', english: 'Men' },
  { id: 'women', label: 'Women', english: 'Women' },
  { id: 'kids', label: 'Kids', english: 'Kids' },
  { id: 'winter', label: 'Winter', english: 'Winter' },
  { id: 'household', label: 'Household', english: 'Household' },
];

export type ClothWallTileSource = 'catalog' | 'service' | 'garment';

export type ClothWallTile = {
  id: string;
  source: ClothWallTileSource;
  catalogItemId?: string;
  garmentItemId?: string;
  serviceId?: string;
  slug: string;
  name: string;
  hinglish: string;
  english: string;
  category: ClothWallCategoryChip | 'other';
  photo: WashhouseCatalogPhoto;
  priceMode: 'single' | 'dual' | 'deferred';
  allowsPress: boolean;
  dryCleanInr: number | null;
  pressInr: number | null;
  priceInr: number | null;
  defaultProcess: ClothWallProcess;
};

function parseInr(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapCatalogCategory(
  category: PartnerPriceListItem['category'],
): ClothWallCategoryChip | 'other' {
  if (
    category === 'men' ||
    category === 'women' ||
    category === 'kids' ||
    category === 'winter' ||
    category === 'household'
  ) {
    return category;
  }
  return 'other';
}

function defaultProcessForItem(item: PartnerPriceListItem): ClothWallProcess {
  if (item.price_mode === 'single' || item.price_inr) return 'single';
  if (item.dry_clean_inr) return 'dry_clean';
  if (item.press_inr && item.allows_press) return 'press';
  return 'single';
}

/** Prefer offered partner price-list rows; otherwise empty (caller falls back to services). */
export function buildCatalogClothWallTiles(
  items: PartnerPriceListItem[],
): ClothWallTile[] {
  return items
    .filter((item) => item.is_offered === true)
    .filter((item) => item.price_mode !== 'deferred')
    .map((item) => {
      const labels = garmentDisplayLabel(item.slug, item.name);
      const category = mapCatalogCategory(item.category);
      return {
        id: `catalog:${item.catalog_item_id}`,
        source: 'catalog' as const,
        catalogItemId: item.catalog_item_id,
        slug: item.slug,
        name: item.name,
        hinglish: labels.hinglish,
        english: labels.english,
        category,
        photo: resolvePriceListItemPhoto(
          item.slug,
          item.name,
          item.category,
        ),
        priceMode: item.price_mode,
        allowsPress: item.allows_press,
        dryCleanInr: parseInr(item.dry_clean_inr),
        pressInr: parseInr(item.press_inr),
        priceInr: parseInr(item.price_inr),
        defaultProcess: defaultProcessForItem(item),
      };
    })
    .sort((a, b) => a.hinglish.localeCompare(b.hinglish));
}

function mapGarmentCategory(category: GarmentCategory): ClothWallCategoryChip | 'other' {
  if (
    category === 'men' ||
    category === 'women' ||
    category === 'kids' ||
    category === 'household'
  ) {
    return category;
  }
  return 'other';
}

function defaultProcessForGarment(
  dryCleanInr: number | null,
  pressInr: number | null,
  priceInr: number | null,
): ClothWallProcess {
  if (priceInr != null && dryCleanInr == null && pressInr == null) return 'single';
  if (dryCleanInr != null) return 'dry_clean';
  if (pressInr != null) return 'press';
  if (priceInr != null) return 'single';
  return 'single';
}

/** Ops garment rate card → Cloth Wall tiles (visible rows only). */
export function buildGarmentClothWallTiles(items: GarmentCatalogItem[]): ClothWallTile[] {
  return items
    .filter((item) => item.is_visible)
    .map((item) => {
      const dryCleanInr = parseInr(item.rates.dry_cleaning?.price_inr);
      const pressInr = parseInr(item.rates.steam_press?.price_inr);
      const shoeInr = parseInr(item.rates.shoe_cleaning?.price_inr);
      const labels = garmentDisplayLabel(item.garment_code, item.name);
      const photo = resolveGarmentCatalogPhoto(item);
      const hasDual = dryCleanInr != null || pressInr != null;
      const priceInr = shoeInr ?? parseInr(item.rates.commercial_service?.price_inr);
      let priceMode: ClothWallTile['priceMode'] = 'deferred';
      if (hasDual) priceMode = 'dual';
      else if (priceInr != null) priceMode = 'single';

      return {
        id: `garment:${item.id}`,
        source: 'garment' as const,
        garmentItemId: item.id,
        catalogItemId: item.platform_catalog_item_id ?? undefined,
        slug: item.garment_code,
        name: item.name,
        hinglish: labels.hinglish,
        english: labels.english,
        category: mapGarmentCategory(item.category),
        photo,
        priceMode,
        allowsPress: pressInr != null,
        dryCleanInr,
        pressInr,
        priceInr: hasDual ? null : priceInr,
        defaultProcess: defaultProcessForGarment(dryCleanInr, pressInr, priceInr),
      };
    })
    .filter((tile) => tile.priceMode !== 'deferred')
    .sort((a, b) => a.hinglish.localeCompare(b.hinglish));
}

export function resolveClothWallTiles(options: {
  garmentItems: GarmentCatalogItem[];
  priceListItems: PartnerPriceListItem[];
  services: ServiceCatalogItem[];
}): { tiles: ClothWallTile[]; source: ClothWallTileSource } {
  const garmentTiles = buildGarmentClothWallTiles(options.garmentItems);
  if (garmentTiles.length > 0) {
    return { tiles: garmentTiles, source: 'garment' };
  }
  const catalogTiles = buildCatalogClothWallTiles(options.priceListItems);
  if (catalogTiles.length > 0) {
    return { tiles: catalogTiles, source: 'catalog' };
  }
  return { tiles: buildServiceClothWallTiles(options.services), source: 'service' };
}

function guessServiceCategory(name: string, category: string): ClothWallCategoryChip | 'other' {
  const blob = `${name} ${category}`.toLowerCase();
  if (/women|saree|kurti|blouse|lehenga|gown|skirt/.test(blob)) return 'women';
  if (/kid|child|frock|boy|girl/.test(blob)) return 'kids';
  if (/winter|sweater|jacket|hoodie|overcoat|shawl/.test(blob)) return 'winter';
  if (/household|bedsheet|blanket|curtain|sofa|shoe/.test(blob)) return 'household';
  if (/men|shirt|trouser|kurta|coat|pant/.test(blob)) return 'men';
  return 'other';
}

/** Fallback tiles from free-form laundry_services with photo resolver. */
export function buildServiceClothWallTiles(
  services: ServiceCatalogItem[],
): ClothWallTile[] {
  return services
    .filter((s) => s.is_active && (s.catalog_status ?? 'active') === 'active')
    .map((svc) => {
      const labels = garmentDisplayLabel(null, svc.name);
      const category = guessServiceCategory(svc.name, svc.category);
      const photo =
        resolveWashhouseCatalogPhoto(svc.name.toLowerCase().replace(/\s+/g, '-'), svc.name) ??
        (category !== 'other'
          ? WASHHOUSE_CATALOG_CATEGORY_HEROES[category]
          : WASHHOUSE_CATALOG_CATEGORY_HEROES.men);
      return {
        id: `service:${svc.id}`,
        source: 'service' as const,
        serviceId: svc.id,
        slug: svc.name,
        name: svc.name,
        hinglish: labels.hinglish,
        english: labels.english,
        category,
        photo,
        priceMode: 'single' as const,
        allowsPress: false,
        dryCleanInr: null,
        pressInr: null,
        priceInr: parseInr(svc.price_inr),
        defaultProcess: 'single' as const,
      };
    })
    .sort((a, b) => a.hinglish.localeCompare(b.hinglish));
}

export function unitPriceForTile(
  tile: ClothWallTile,
  process: ClothWallProcess,
): number {
  if (process === 'dry_clean') return tile.dryCleanInr ?? 0;
  if (process === 'press') return tile.pressInr ?? 0;
  return tile.priceInr ?? tile.dryCleanInr ?? 0;
}

export function filterTilesByCategory(
  tiles: ClothWallTile[],
  category: ClothWallCategoryChip | 'all',
): ClothWallTile[] {
  if (category === 'all') return tiles;
  return tiles.filter((t) => t.category === category);
}
