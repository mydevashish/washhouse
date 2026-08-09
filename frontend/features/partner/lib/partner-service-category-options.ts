import {
  normalizeServiceCategory,
  SERVICE_CATEGORY_ORDER,
  serviceCategoryLabel,
} from '@/features/discover/detail/lib/normalize-service-category';

export type PartnerServiceCategoryOption = { slug: string; name: string };

/** Build a catalog slug + label from a partner-entered category name. */
export function partnerCategoryOptionFromName(name: string): PartnerServiceCategoryOption | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = normalizeServiceCategory(
    trimmed
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-'),
  );
  if (!slug) return null;
  return { slug, name: trimmed };
}

/** Platform categories + any slugs already used on this partner's services (for stable selects). */
export function buildPartnerServiceCategoryOptions(
  apiRows: { slug: string; name: string }[] | undefined,
  serviceCategoryValues: string[],
  customOptions: PartnerServiceCategoryOption[] = [],
): PartnerServiceCategoryOption[] {
  const byNorm = new Map<string, PartnerServiceCategoryOption>();

  for (const row of apiRows ?? []) {
    const norm = normalizeServiceCategory(row.slug);
    if (!norm) continue;
    byNorm.set(norm, { slug: row.slug, name: row.name });
  }

  for (const opt of customOptions) {
    const norm = normalizeServiceCategory(opt.slug);
    if (!norm) continue;
    byNorm.set(norm, { slug: opt.slug, name: opt.name });
  }

  for (const raw of serviceCategoryValues) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const norm = normalizeServiceCategory(trimmed);
    if (!norm || byNorm.has(norm)) continue;
    byNorm.set(norm, { slug: trimmed, name: serviceCategoryLabel(norm) });
  }

  if (byNorm.size === 0) {
    return [{ slug: 'wash', name: 'Wash' }];
  }

  const known = SERVICE_CATEGORY_ORDER.filter((k) => byNorm.has(k)).map(
    (k) => byNorm.get(k)!,
  );
  const knownSet = new Set<string>(SERVICE_CATEGORY_ORDER);
  const extras = [...byNorm.entries()]
    .filter(([k]) => !knownSet.has(k))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([, v]) => v);

  return [...known, ...extras];
}

/** Map a stored laundry_services.category value to a select option slug. */
export function resolvePartnerServiceCategorySlug(
  raw: string,
  options: PartnerServiceCategoryOption[],
): string {
  const norm = normalizeServiceCategory(raw);
  if (!norm) return options[0]?.slug ?? 'wash';
  const match = options.find((o) => normalizeServiceCategory(o.slug) === norm);
  return match?.slug ?? norm;
}
