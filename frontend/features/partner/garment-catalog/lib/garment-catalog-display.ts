import { resolveServicePhoto } from '@/features/discover/detail/lib/resolve-service-photo';
import {
  GARMENT_PRIMARY_SERVICE_TYPES,
  GARMENT_SERVICE_TYPES,
  garmentPrimaryPriceInr,
  garmentServiceTypeLabel,
  type GarmentCatalogItem,
  type GarmentCategory,
  type GarmentServiceType,
} from '@/services/partner-garment-catalog';

const GARMENT_CATEGORY_PHOTO_HINT: Record<GarmentCategory, string> = {
  men: 'dry-clean',
  women: 'dry-clean',
  kids: 'wash',
  household: 'home-linen',
  institutional: 'specialty',
  others: 'specialty',
};

export type GarmentPriceChip = {
  type: GarmentServiceType;
  label: string;
  inr: string;
};

/** Primary counter price chips — dry clean, press, shoe clean; fallback to any priced service. */
export function garmentPriceChips(item: GarmentCatalogItem): GarmentPriceChip[] {
  const chips: GarmentPriceChip[] = [];
  for (const type of GARMENT_PRIMARY_SERVICE_TYPES) {
    const inr = item.rates[type]?.price_inr;
    if (inr && Number(inr) > 0) {
      chips.push({ type, label: garmentServiceTypeLabel(type), inr });
    }
  }
  if (chips.length === 0) {
    const fallback = garmentPrimaryPriceInr(item);
    if (fallback) {
      chips.push({
        type: 'dry_cleaning',
        label: garmentServiceTypeLabel('dry_cleaning'),
        inr: fallback,
      });
    }
  }
  return chips;
}

export function resolveGarmentCatalogPhoto(
  item: Pick<GarmentCatalogItem, 'name' | 'category' | 'image_url' | 'resolved_image_url'>,
): { src: string; alt: string } {
  const uploaded = item.resolved_image_url ?? item.image_url;
  if (uploaded) {
    return { src: uploaded, alt: item.name };
  }
  const fallback = resolveServicePhoto(item.name, GARMENT_CATEGORY_PHOTO_HINT[item.category]);
  return { src: fallback.src, alt: fallback.alt || item.name };
}

/** Service columns that have at least one non-zero price on the current page. */
export function visibleGarmentServiceColumns(items: GarmentCatalogItem[]): GarmentServiceType[] {
  const seen = new Set<GarmentServiceType>();
  for (const item of items) {
    for (const type of GARMENT_SERVICE_TYPES) {
      const inr = item.rates[type]?.price_inr;
      if (inr && Number(inr) > 0) seen.add(type);
    }
  }
  return GARMENT_SERVICE_TYPES.filter((t) => seen.has(t));
}

export function nextGarmentVisibility(current: boolean): boolean {
  return !current;
}

export function garmentRatesToFormValues(
  rates: GarmentCatalogItem['rates'],
): Record<GarmentServiceType, string> {
  const out = {} as Record<GarmentServiceType, string>;
  for (const type of GARMENT_SERVICE_TYPES) {
    const inr = rates[type]?.price_inr;
    out[type] = inr ? String(Number(inr)) : '';
  }
  return out;
}

export function formRatesToApiPayload(
  rates: Record<GarmentServiceType, string>,
): Partial<Record<GarmentServiceType, number | null>> {
  const payload: Partial<Record<GarmentServiceType, number | null>> = {};
  for (const type of GARMENT_SERVICE_TYPES) {
    const raw = rates[type]?.trim();
    if (!raw) {
      payload[type] = null;
      continue;
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) payload[type] = n;
    else payload[type] = null;
  }
  return payload;
}

export { GARMENT_PRIMARY_SERVICE_TYPES };

export const GARMENT_SECONDARY_SERVICE_TYPES: GarmentServiceType[] = GARMENT_SERVICE_TYPES.filter(
  (t) => !GARMENT_PRIMARY_SERVICE_TYPES.includes(t as (typeof GARMENT_PRIMARY_SERVICE_TYPES)[number]),
);
