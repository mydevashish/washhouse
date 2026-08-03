import type {
  BookingRequestPriority,
  BookingRequestSlaBadge,
  BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';

export type BookingRequestMessageVisibility = 'customer_facing' | 'internal';

export type BookingRequestRow = {
  id: string;
  public_code: string;
  customer_name: string;
  phone_e164: string;
  service_type: string;
  preferred_time_window: string;
  address_text: string | null;
  city: string | null;
  pincode: string | null;
  notes: string | null;
  source: string;
  status: BookingRequestStatus | string;
  priority: BookingRequestPriority | string;
  sla_badge: BookingRequestSlaBadge | string;
  sla_age_seconds: number;
  assigned_laundry_id: string | null;
  assigned_laundry_name: string | null;
  assigned_at: string | null;
  assigned_by_user_id: string | null;
  converted_order_id: string | null;
  created_by_role: string;
  created_by_user_id: string | null;
  last_response_at: string | null;
  closed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  whatsapp_url: string;
  open_duplicate_ids: string[];
};

export type BookingRequestMessage = {
  id: string;
  booking_request_id: string;
  author_user_id: string | null;
  author_role: string;
  visibility: BookingRequestMessageVisibility | string;
  body: string;
  created_at: string;
};

export type BookingRequestEvent = {
  id: string;
  booking_request_id: string;
  event_type: string;
  actor_user_id: string | null;
  from_status: string | null;
  to_status: string | null;
  from_laundry_id: string | null;
  to_laundry_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type BookingRequestDetail = BookingRequestRow & {
  messages: BookingRequestMessage[];
  events: BookingRequestEvent[];
};

export type BookingRequestPhoneTimeline = {
  phone_e164: string;
  requests: BookingRequestRow[];
  messages_preview: BookingRequestMessage[];
};

export type BookingRequestInboxMeta = {
  new?: number;
  reviewing?: number;
  overdue?: number;
};

export type BookingRequestListResult = {
  items: BookingRequestRow[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  inbox: BookingRequestInboxMeta;
};

export type BookingRequestListFilters = {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  assigned_laundry_id?: string;
  unassigned?: boolean;
  phone?: string;
  q?: string;
  source?: string;
  include_deleted?: boolean;
  created_from?: string;
  created_to?: string;
  sort?: string;
};

export type BookingRequestUpdatePayload = {
  customer_name?: string;
  service_type?: string;
  preferred_time_window?: string;
  notes?: string | null;
  address_text?: string | null;
  city?: string | null;
  pincode?: string | null;
  priority?: string;
  status?: string;
};

export type BookingRequestAdminCreatePayload = {
  customer_name: string;
  phone: string;
  service_type: string;
  preferred_time_window: string;
  notes?: string;
  address_text?: string;
  city?: string;
  pincode?: string;
  assigned_laundry_id?: string;
  priority?: string;
  status?: string;
};

export type BookingRequestMessagePayload = {
  body: string;
  visibility: BookingRequestMessageVisibility;
};

export type BookingRequestLaundrySuggestion = {
  laundry_id: string;
  name: string;
  city: string;
  avg_rating: number;
  reason: string;
  score: number;
};

export type BookingRequestSuggestLaundries = {
  suggestions: BookingRequestLaundrySuggestion[];
};
