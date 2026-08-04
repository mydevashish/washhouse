import type {
  BookingRequestConvertPayload,
  BookingRequestConvertResult,
} from '@/features/admin/booking-requests/api';
import { buildPartnerBookingListParams } from '@/features/partner/booking-requests/api-params';
import type {
  BookingRequestDetail,
  BookingRequestListFilters,
  BookingRequestListResult,
  BookingRequestMessagePayload,
  BookingRequestPartnerCreatePayload,
  BookingRequestPhoneTimeline,
  BookingRequestRow,
  BookingRequestUpdatePayload,
} from '@/features/partner/booking-requests/types';
import { api, type ApiEnvelope } from '@/lib/api';

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

export async function listPartnerBookingRequests(
  filters: BookingRequestListFilters = {},
): Promise<BookingRequestListResult> {
  const { data } = await api.get<ApiEnvelope<BookingRequestRow[]>>('/partner/booking-requests', {
    params: buildPartnerBookingListParams(filters),
  });
  return parseList(data.data ?? [], data.meta as ListMeta | undefined, filters);
}

export async function getPartnerBookingRequest(id: string): Promise<BookingRequestDetail> {
  const { data } = await api.get<ApiEnvelope<BookingRequestDetail>>(
    `/partner/booking-requests/${id}`,
  );
  return data.data;
}

export async function createPartnerBookingRequest(
  payload: BookingRequestPartnerCreatePayload,
): Promise<BookingRequestRow> {
  const { data } = await api.post<ApiEnvelope<BookingRequestRow>>(
    '/partner/booking-requests',
    payload,
  );
  return data.data;
}

export async function updatePartnerBookingRequest(
  id: string,
  payload: BookingRequestUpdatePayload,
): Promise<BookingRequestDetail> {
  const { data } = await api.patch<ApiEnvelope<BookingRequestDetail>>(
    `/partner/booking-requests/${id}`,
    payload,
  );
  return data.data;
}

export async function releasePartnerBookingRequest(id: string): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/partner/booking-requests/${id}/release`,
  );
  return data.data;
}

export async function addPartnerBookingRequestMessage(
  id: string,
  payload: BookingRequestMessagePayload,
): Promise<BookingRequestDetail> {
  const { data } = await api.post<ApiEnvelope<BookingRequestDetail>>(
    `/partner/booking-requests/${id}/messages`,
    payload,
  );
  return data.data;
}

export async function getPartnerBookingRequestsByPhone(
  phone: string,
): Promise<BookingRequestPhoneTimeline> {
  const encoded = encodeURIComponent(phone);
  const { data } = await api.get<ApiEnvelope<BookingRequestPhoneTimeline>>(
    `/partner/booking-requests/by-phone/${encoded}`,
  );
  return data.data;
}

export async function convertPartnerBookingRequest(
  id: string,
  payload: BookingRequestConvertPayload,
): Promise<BookingRequestConvertResult> {
  const { data } = await api.post<ApiEnvelope<BookingRequestConvertResult>>(
    `/partner/booking-requests/${id}/convert`,
    { ...payload, force: false },
  );
  return data.data;
}
