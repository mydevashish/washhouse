import { api, type ApiEnvelope } from '@/lib/api';

export interface LaundryListItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  avg_rating: string;
  review_count: number;
  is_verified: boolean;
  rank_score?: number | null;
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

export async function listLaundries(city?: string): Promise<LaundryListItem[]> {
  const { data } = await api.get<ApiEnvelope<LaundryListItem[]>>('/laundries', {
    params: city ? { city } : undefined,
  });
  return data.data;
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
