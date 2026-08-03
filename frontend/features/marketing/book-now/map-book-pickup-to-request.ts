import {
  BOOK_NOW_QUERY_PARAM,
  BOOK_NOW_QUERY_VALUE,
  type BookNowPreferredTime,
  type BookNowServiceId,
} from '@/features/marketing/book-now/book-now-constants';
import type { BookingRequestPublicCreate } from '@/lib/api/booking-requests';

export type BookPickupSubmitValues = {
  name: string;
  phone: string;
  service: BookNowServiceId;
  preferredTime: BookNowPreferredTime;
  message?: string;
};

export type BookingRequestPublicSource = NonNullable<BookingRequestPublicCreate['source']>;

/**
 * Resolve Book Now `source` from the current URL (SSR-safe default: marketing_home).
 */
export function resolveBookingRequestSource(
  pathname?: string,
  search?: string,
): BookingRequestPublicSource {
  if (typeof window === 'undefined' && pathname === undefined) {
    return 'marketing_home';
  }
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const query =
    search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  if (params.get(BOOK_NOW_QUERY_PARAM) === BOOK_NOW_QUERY_VALUE) {
    return 'deep_link';
  }
  if (path.startsWith('/stores')) return 'stores';
  if (path.startsWith('/services')) return 'services';
  return 'marketing_home';
}

/**
 * Map BookPickupForm values → POST /booking-requests body.
 */
export function mapBookPickupToBookingRequest(
  values: BookPickupSubmitValues,
  source: BookingRequestPublicSource = 'marketing_home',
): BookingRequestPublicCreate {
  const notes = values.message?.trim();
  return {
    customer_name: values.name.trim(),
    phone: values.phone,
    service_type: values.service,
    preferred_time_window: values.preferredTime,
    ...(notes ? { notes } : {}),
    source,
  };
}
