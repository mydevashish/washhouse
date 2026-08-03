import { z } from 'zod';

import { api, type ApiEnvelope } from '@/lib/api';
import {
  BOOK_NOW_PREFERRED_TIMES,
  BOOK_NOW_SERVICES,
  type BookNowPreferredTime,
  type BookNowServiceId,
} from '@/features/marketing/book-now/book-now-constants';

const serviceValues = BOOK_NOW_SERVICES.map((s) => s.value) as [
  BookNowServiceId,
  ...BookNowServiceId[],
];

const preferredTimeValues = BOOK_NOW_PREFERRED_TIMES.map((t) => t.value) as [
  BookNowPreferredTime,
  ...BookNowPreferredTime[],
];

export const bookingRequestSourceSchema = z.enum([
  'marketing_home',
  'stores',
  'services',
  'deep_link',
]);

export const bookingRequestPublicCreateSchema = z.object({
  customer_name: z.string().trim().min(1).max(100),
  phone: z.string().min(8).max(20),
  service_type: z.enum(serviceValues),
  preferred_time_window: z.enum(preferredTimeValues),
  notes: z.string().trim().max(1500).optional(),
  address_text: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(10).optional(),
  source: bookingRequestSourceSchema.optional(),
});

const bookingRequestPublicCreatedSchema = z.object({
  id: z.string().uuid(),
  public_code: z.string().min(1),
  status: z.string(),
});

export type BookingRequestPublicCreate = z.infer<typeof bookingRequestPublicCreateSchema>;
export type BookingRequestPublicCreated = z.infer<typeof bookingRequestPublicCreatedSchema>;

export type BookingRequestCreateMeta = {
  duplicate_warning?: boolean;
  open_request_ids?: string[];
};

/**
 * Public Book Now → POST /booking-requests (replaces marketing contact `order-help` path).
 * General contact form still uses POST /marketing/contact.
 */
export async function submitBookingRequest(
  payload: BookingRequestPublicCreate,
): Promise<{ data: BookingRequestPublicCreated; meta: BookingRequestCreateMeta }> {
  const body = bookingRequestPublicCreateSchema.parse(payload);
  const { data } = await api.post<ApiEnvelope<unknown>>('/booking-requests', body);
  const created = bookingRequestPublicCreatedSchema.parse(data.data);
  const meta = (data.meta ?? {}) as BookingRequestCreateMeta;
  return { data: created, meta };
}
