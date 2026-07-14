import { api, type ApiEnvelope } from '@/lib/api';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_inr: string;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  express_available?: boolean;
  pickup_available?: boolean;
  delivery_available?: boolean;
  catalog_status?: string;
  view_count?: number;
  order_count?: number;
  sort_order?: number;
  is_active: boolean;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ContactInfo {
  offline_booking_mode?: boolean;
  contact_available?: boolean;
  can_contact: boolean;
  requires_login: boolean;
  show_call: boolean;
  show_whatsapp: boolean;
  show_callback: boolean;
  phone: string | null;
  whatsapp_number: string | null;
  whatsapp_url: string | null;
  address_line?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  full_address?: string | null;
  map_url?: string | null;
  working_hours?: Record<string, string> | null;
}

export interface CustomerQuestion {
  id: string;
  laundry_id: string;
  customer_id: string;
  question: string;
  answer: string | null;
  status: string;
  answered_at: string | null;
  created_at: string;
}

export interface EngagementAnalytics {
  store_views: number;
  service_views: number;
  calls_generated: number;
  whatsapp_clicks: number;
  questions_asked: number;
  callback_requests: number;
  conversion_rate_pct: number;
}

export type ServiceSort = 'popular' | 'price_asc' | 'price_desc';

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const { data } = await api.get<ApiEnvelope<ServiceCategory[]>>('/service-categories');
  return data.data;
}

export async function browseServiceCatalog(
  laundryId: string,
  params?: { q?: string; category?: string; express_only?: boolean; sort?: ServiceSort },
): Promise<ServiceCatalogItem[]> {
  const { data } = await api.get<ApiEnvelope<ServiceCatalogItem[]>>(
    `/laundries/${laundryId}/services/catalog`,
    { params },
  );
  return data.data;
}

export async function getServiceDetail(laundryId: string, serviceId: string): Promise<ServiceCatalogItem> {
  const { data } = await api.get<ApiEnvelope<ServiceCatalogItem>>(
    `/laundries/${laundryId}/services/${serviceId}`,
  );
  return data.data;
}

export async function trackStoreView(laundryId: string): Promise<void> {
  await api.post(`/laundries/${laundryId}/engagement/store-view`);
}

export async function getContactInfo(laundryId: string): Promise<ContactInfo> {
  const { data } = await api.get<ApiEnvelope<ContactInfo>>(`/laundries/${laundryId}/contact`);
  return data.data;
}

export async function trackContactEvent(
  laundryId: string,
  body: { event_type: string; service_id?: string; source?: string },
): Promise<ContactInfo> {
  const { data } = await api.post<ApiEnvelope<ContactInfo>>(`/laundries/${laundryId}/contact/track`, body);
  return data.data;
}

export async function requestCallback(
  laundryId: string,
  body: { phone: string; preferred_time?: string },
): Promise<{ id: string; status: string }> {
  const { data } = await api.post<ApiEnvelope<{ id: string; status: string }>>(
    `/laundries/${laundryId}/callback`,
    body,
  );
  return data.data;
}

export async function listPublicQuestions(laundryId: string): Promise<CustomerQuestion[]> {
  const { data } = await api.get<ApiEnvelope<CustomerQuestion[]>>(`/laundries/${laundryId}/questions`);
  return data.data;
}

export async function askQuestion(laundryId: string, question: string): Promise<CustomerQuestion> {
  const { data } = await api.post<ApiEnvelope<CustomerQuestion>>(`/laundries/${laundryId}/questions`, {
    question,
  });
  return data.data;
}

export async function getPartnerEngagementAnalytics(days = 30): Promise<EngagementAnalytics> {
  const { data } = await api.get<ApiEnvelope<EngagementAnalytics>>('/partner/engagement-analytics', {
    params: { days },
  });
  return data.data;
}

export async function listPartnerQuestions(): Promise<CustomerQuestion[]> {
  const { data } = await api.get<ApiEnvelope<CustomerQuestion[]>>('/partner/questions');
  return data.data;
}

export async function answerPartnerQuestion(questionId: string, answer: string): Promise<CustomerQuestion> {
  const { data } = await api.post<ApiEnvelope<CustomerQuestion>>(`/partner/questions/${questionId}/answer`, {
    answer,
  });
  return data.data;
}
