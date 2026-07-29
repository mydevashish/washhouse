/** Canonical service category slug (hyphenated) for chips, deep-links, and grouping. */
export function normalizeServiceCategory(category: string): string {
  return category.trim().toLowerCase().replace(/_/g, '-');
}

/** Display labels for laundry service categories (seed + platform tags). */
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  wash: 'Wash & Fold',
  iron: 'Ironing',
  'wash-iron': 'Wash + Iron',
  'dry-clean': 'Dry Clean',
  'premium-care': 'Premium Care',
  'home-linen': 'Home Linen',
  specialty: 'Specialty',
  special: 'Specialty',
};

/** Preferred chip / section order when a store offers multiple categories. */
export const SERVICE_CATEGORY_ORDER: readonly string[] = [
  'wash',
  'wash-iron',
  'iron',
  'dry-clean',
  'premium-care',
  'home-linen',
  'specialty',
  'special',
];

export function serviceCategoryLabel(category: string): string {
  const key = normalizeServiceCategory(category);
  if (SERVICE_CATEGORY_LABELS[key]) return SERVICE_CATEGORY_LABELS[key];
  return category
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function serviceCategorySectionId(category: string): string {
  return `svc-cat-${normalizeServiceCategory(category)}`;
}
