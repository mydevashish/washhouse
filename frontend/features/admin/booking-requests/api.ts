import { api, type ApiEnvelope } from '@/lib/api';
import type {
  BookingRequestAdminCreatePayload,
  BookingRequestDetail,
  BookingRequestListFilters,
  BookingRequestListResult,
  BookingRequestMessagePayload,
  BookingRequestPhoneTimeline,
  BookingRequestRow,
  BookingRequestSuggestLaundries,
  BookingRequestUpdatePayload,
} from '@/features/admin/booking-requests/types';

type PaginationMeta = {
  page?: number;
  per_page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
};

type ListMeta = {
  pagination?: PaginationMeta;
  inbox?: BookingRequestListResult['inbox'];
};

function buildParams(filters: BookingRequestListFilters): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) p[k] = v as string | number | boolean;
  });
  return p;
}

function parseList(
  data: BookingRequestRow[],
  meta: ListMeta | undefined,
  filters: BookingRequestListFilters,
): BookingRequestListResult {
  const pagination = meta?.pagination ?? {};
  const page = pagination.page ?? filters.page ?? 1;
  const pageSize = pagination.per_page ?? pagination.page_size ?? filters.page_size ?? 20;
  const total = pagination.total ?? data.length;
  const totalPages = pagination.total_pages ?? Math.max(1, Math.ceil(total / pageSize));
  return {
    items: data,
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages,
    has_next: pagination.has_next ?? page < totalPages,
    has_previous: pagination.has_previous ?? page > 1,
    inbox: meta?.inbox ?? {},
  };
}

export async function listAdminBookingRequests(
  filters: BookingRequestListFilters = {},
): Promise<BookingRequestListResult> {
  const { data } = await api.get<ApiEnvelope<BookingRequestRow[]>>('/admin/booking-requests', {
    params: buildParams(filters),
  });
  return parseList(data.data ?? [], data.meta as ListMeta | undefined, filters);
}

export async function getAdminBookingRequest(id: string): Promise<BookingRequestDetail> {
  const { data } = await api.get<ApiEnvelope<BookingRequestDetail>>(`/admin/booking-requests/${id}`);
  return data.data;
}

export async function createAdminBookingRequest(
  payload: BookingRequestAdminCreatePayload,
): Promise<BookingRequestRow> {
  const { data } = await api.post<ApiEnvelope<BookingRequestRow>>('/admin/booking-requests', payload);
  return data.data;
}

export async function updateAdminBookingRequest(
  id: string,
  payload: BookingRequestUpdatePayload,
): Promise<BookingRequestDetail> {
  const { data } = await api.patch<ApiEnvelope<BookingRequestDetail>>(
    `/admin/booking-requests/${id}`,
    payload,
  );
  return data.data;
}

export async function softDeleteAdminBookingRequest(id: string): Promise<BookingRequestRow> {
  const { data } = await api.delete<ApiEnvelope<BookingRequestRow>>(`/admin/booking-requests/${id}`);
  return data.data;
}

export async function restoreAdminBookingRequest(id: string): Promise<BookingRequestRow> {
  const { data } = await api.post<ApiEnvelope<BookingRequestRow>>(
    `/admin/booking-requests/${id}/restore`,
  );
  return data.data;
}

export async function claimAdminBookingRequest(id: string): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/admin/booking-requests/${id}/claim`,
  );
  return data.data;
}

export async function assignAdminBookingRequest(
  id: string,
  laundryId: string,
  note?: string,
): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/admin/booking-requests/${id}/assign`,
    { laundry_id: laundryId, note: note || undefined },
  );
  return data.data;
}

export async function releaseAdminBookingRequest(id: string): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/admin/booking-requests/${id}/release`,
  );
  return data.data;
}

export async function addAdminBookingRequestMessage(
  id: string,
  payload: BookingRequestMessagePayload,
): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/admin/booking-requests/${id}/messages`,
    payload,
  );
  return data.data;
}

export async function getAdminBookingRequestsByPhone(
  phone: string,
): Promise<BookingRequestPhoneTimeline> {
  const encoded = encodeURIComponent(phone);
  const { data } = await api.get<ApiEnvelope<BookingRequestPhoneTimeline>>(
    `/admin/booking-requests/by-phone/${encoded}`,
  );
  return data.data;
}

export async function suggestAdminBookingRequestLaundries(
  id: string,
  limit = 5,
): Promise<BookingRequestSuggestLaundries> {
  const { data } = await api.get<ApiEnvelope<BookingRequestSuggestLaundries>>(
    `/admin/booking-requests/${id}/suggest-laundries`,
    { params: { limit } },
  );
  return data.data ?? { suggestions: [] };
}

export type BookingRequestConvertPayload = {
  force?: boolean;
  laundry_id?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  address_id?: string;
  pickup_at: string;
  delivery_at: string;
  items: { service_id: string; quantity: number }[];
  notes?: string;
  payment_method?: 'cod';
};

export type BookingRequestConvertResult = {
  booking_request_id: string;
  public_code: string;
  status: string;
  converted_order_id: string;
  tracking_code: string;
  order_source: string;
  total_inr: string;
  currency?: string;
};

export async function convertAdminBookingRequest(
  id: string,
  payload: BookingRequestConvertPayload,
): Promise<BookingRequestConvertResult> {
  const { data } = await api.post<ApiEnvelope<BookingRequestConvertResult>>(
    `/admin/booking-requests/${id}/convert`,
    payload,
  );
  return data.data;
}
