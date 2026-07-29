import type { LaundryServiceItem } from '@/services/laundries';
import {
  normalizeServiceCategory,
  SERVICE_CATEGORY_ORDER,
  serviceCategoryLabel,
} from '@/features/discover/detail/lib/normalize-service-category';

export type ServiceCategoryGroup = {
  /** Canonical hyphenated category key. */
  category: string;
  label: string;
  services: LaundryServiceItem[];
};

/**
 * Group active laundry services by category for storefront catalogue sections.
 * Unknown categories sort after the known order, alphabetically by label.
 */
export function groupServicesByCategory(
  services: LaundryServiceItem[],
): ServiceCategoryGroup[] {
  const byCategory = new Map<string, LaundryServiceItem[]>();

  for (const svc of services) {
    if (!svc.is_active) continue;
    const key = normalizeServiceCategory(svc.category || 'other');
    const list = byCategory.get(key) ?? [];
    list.push(svc);
    byCategory.set(key, list);
  }

  const known = SERVICE_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    label: serviceCategoryLabel(category),
    services: (byCategory.get(category) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const knownSet = new Set(SERVICE_CATEGORY_ORDER);
  const extras = [...byCategory.keys()]
    .filter((c) => !knownSet.has(c))
    .sort((a, b) => serviceCategoryLabel(a).localeCompare(serviceCategoryLabel(b)))
    .map((category) => ({
      category,
      label: serviceCategoryLabel(category),
      services: (byCategory.get(category) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    }));

  return [...known, ...extras];
}
