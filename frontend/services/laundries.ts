import { api, type ApiEnvelope } from '@/lib/api';
import { DISCOVERY_API_TIMEOUT_MS } from '@/lib/query-config';

/** Keep in sync with backend PUBLIC_LIST_DEFAULT_LIMIT / PUBLIC_LIST_MAX_LIMIT. */
export const PUBLIC_LAUNDRY_LIST_PAGE_SIZE = 100;
/** Safety cap: 10 × 100 = 1000 approved stores (directory must not silently truncate). */
const PUBLIC_LAUNDRY_LIST_MAX_PAGES = 10;

type ListPaginationMeta = {
  total?: number;
  has_next?: boolean;
};

export interface LaundryListItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  avg_rating: string;
  review_count: number;
  is_verified: boolean;
  rank_score?: number | null;
  /** Store coords when published — client near-me (haversine); may be null */
  latitude?: number | null;
  longitude?: number | null;
  /** Owner-set Wash & Fold (kg) when offered — discovery compare hint */
  wash_fold_from_inr?: string | null;
  wash_fold_from_paise?: number | null;
  /** Owner-set Shirt / T-shirt dry-clean when offered */
  shirt_dry_clean_from_inr?: string | null;
  shirt_dry_clean_from_paise?: number | null;
  /** MIN of available compare hints — for filter/sort */
  start_price_inr?: string | null;
  start_price_paise?: number | null;
}

export interface LaundrySearchResponse {
  items: LaundryListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type LaundrySearchSort = 'relevance' | 'rating' | 'name';

export interface LaundryServiceItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_inr: string;
  is_active: boolean;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  express_available?: boolean;
  pickup_available?: boolean;
  delivery_available?: boolean;
  view_count?: number;
  order_count?: number;
}

export interface LaundryDetail extends LaundryListItem {
  description: string | null;
  address_line: string;
  services: LaundryServiceItem[];
}

export interface Review {
  id: string;
  laundry_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Normalize list API payloads (array or accidental search-shaped envelope). */
export function parseLaundryListPayload(payload: unknown): LaundryListItem[] {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray((payload as LaundrySearchResponse).items)
  ) {
    return (payload as LaundrySearchResponse).items;
  }
  return [];
}

/**
 * Fetch the full public approved directory.
 * Pages via limit/offset until exhausted — Near me / discover must not drop
 * newly approved low-rated stores that fall past the first page.
 */
export async function listLaundries(city?: string): Promise<LaundryListItem[]> {
  const all: LaundryListItem[] = [];
  let offset = 0;

  for (let page = 0; page < PUBLIC_LAUNDRY_LIST_MAX_PAGES; page++) {
    const { data } = await api.get<ApiEnvelope<LaundryListItem[] | LaundrySearchResponse>>(
      '/laundries',
      {
        params: {
          ...(city ? { city } : {}),
          limit: PUBLIC_LAUNDRY_LIST_PAGE_SIZE,
          offset,
        },
        timeout: DISCOVERY_API_TIMEOUT_MS,
      },
    );
    const items = parseLaundryListPayload(data.data);
    all.push(...items);

    const pagination = data.meta?.pagination as ListPaginationMeta | undefined;
    if (pagination?.has_next === false) break;
    if (pagination?.total != null && all.length >= pagination.total) break;
    if (items.length < PUBLIC_LAUNDRY_LIST_PAGE_SIZE) break;

    offset += PUBLIC_LAUNDRY_LIST_PAGE_SIZE;
  }

  return all;
}

export async function searchLaundries(params: {
  q: string;
  city?: string;
  min_rating?: number;
  sort?: LaundrySearchSort;
  limit?: number;
  offset?: number;
}): Promise<LaundrySearchResponse> {
  const { data } = await api.get<ApiEnvelope<LaundrySearchResponse>>('/laundries/search', {
    params,
  });
  return data.data;
}

export async function getLaundry(id: string): Promise<LaundryDetail> {
  const { data } = await api.get<ApiEnvelope<LaundryDetail>>(`/laundries/${id}`);
  return data.data;
}

export async function listReviews(laundryId: string): Promise<Review[]> {
  const { data } = await api.get<ApiEnvelope<Review[]>>(`/laundries/${laundryId}/reviews`);
  return data.data;
}

export async function createReview(
  laundryId: string,
  body: { order_id: string; rating: number; comment?: string },
): Promise<Review> {
  const { data } = await api.post<ApiEnvelope<Review>>(`/laundries/${laundryId}/reviews`, body);
  return data.data;
}
