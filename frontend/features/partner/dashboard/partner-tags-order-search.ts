import type { PartnerOrdersListParams } from '@/services/partner';

/** Debounced server search for Tags section + print center (spec: 300–400 ms). */
export const PARTNER_TAGS_ORDER_SEARCH_DEBOUNCE_MS = 350;

/** Minimum chars before search unless query looks like tracking or token. */
export const PARTNER_TAGS_ORDER_SEARCH_MIN_LENGTH = 3;

/** Pass trimmed string to API — backend uses ilike on tracking, phone, token, name. */
export function normalizePartnerTagsSearchQuery(raw: string): string {
  return raw.trim();
}

/** True when a debounced query should hit `listPartnerOrders` search. */
export function shouldRunPartnerTagsSearch(normalized: string): boolean {
  if (!normalized) return false;
  if (normalized.length >= PARTNER_TAGS_ORDER_SEARCH_MIN_LENGTH) return true;
  if (/^wh-/i.test(normalized)) return true;
  if (/^r-/i.test(normalized)) return true;
  return false;
}

/** Shared list params for dashboard Tags + print center order lookup. */
export function partnerTagsOrderSearchListParams(
  search: string,
): Required<
  Pick<
    PartnerOrdersListParams,
    'search' | 'bucket' | 'page' | 'page_size' | 'sort_by' | 'sort_order'
  >
> {
  return {
    search: normalizePartnerTagsSearchQuery(search),
    bucket: 'all',
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  };
}
