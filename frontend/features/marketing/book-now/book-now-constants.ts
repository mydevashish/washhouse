import { SERVICE_PREVIEW_ITEMS } from '@/features/marketing/home/services-data';

/** Query param that opens the Book Now dialog (`/?book=1`, `/services?book=1`, …). */
export const BOOK_NOW_QUERY_PARAM = 'book';
export const BOOK_NOW_QUERY_VALUE = '1';

/** Browse-stores fallback when a full-page laundry directory is needed. */
export const MARKETING_STORES_FALLBACK_HREF = '/stores';

export const BOOK_NOW_SERVICES = SERVICE_PREVIEW_ITEMS.filter(
  (item) => item.id !== 'more-services',
).map(({ id, title }) => ({ value: id, label: title }));

export const BOOK_NOW_PREFERRED_TIMES = [
  { value: 'morning', label: 'Morning (8 AM – 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM – 5 PM)' },
  { value: 'evening', label: 'Evening (5 PM – 8 PM)' },
  { value: 'flexible', label: 'Flexible — call me to confirm' },
] as const;

export type BookNowServiceId = (typeof BOOK_NOW_SERVICES)[number]['value'];
export type BookNowPreferredTime = (typeof BOOK_NOW_PREFERRED_TIMES)[number]['value'];

/** Default deep-link href for shareable Book Now URLs (opens dialog via query sync). */
export function buildBookNowHref(pathname = '/'): string {
  const path = (pathname.split('?')[0] || '/').trim() || '/';
  return `${path}?${BOOK_NOW_QUERY_PARAM}=${BOOK_NOW_QUERY_VALUE}`;
}
