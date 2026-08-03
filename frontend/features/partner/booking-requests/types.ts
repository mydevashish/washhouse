export type {
  BookingRequestDetail,
  BookingRequestEvent,
  BookingRequestInboxMeta,
  BookingRequestListFilters,
  BookingRequestListResult,
  BookingRequestMessage,
  BookingRequestMessagePayload,
  BookingRequestMessageVisibility,
  BookingRequestPhoneTimeline,
  BookingRequestRow,
  BookingRequestUpdatePayload,
} from '@/features/admin/booking-requests/types';

/** Partner create — laundry is always the token laundry (never sent by client). */
export type BookingRequestPartnerCreatePayload = {
  customer_name: string;
  phone: string;
  service_type: string;
  preferred_time_window: string;
  notes?: string;
  address_text?: string;
  city?: string;
  pincode?: string;
  priority?: string;
};

export type PartnerBookingCreatePrefill = {
  phone?: string;
  customer_name?: string;
};
