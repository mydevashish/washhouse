import { api, type ApiEnvelope } from '@/lib/api';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type AnnouncementTarget =
  | 'all_users'
  | 'customers'
  | 'partners'
  | 'specific_laundries'
  | 'specific_cities';

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  target_type: AnnouncementTarget;
  target_laundry_ids: string[];
  target_cities: string[];
  channel_in_app: boolean;
  channel_email: boolean;
  channel_push: boolean;
  action_url: string | null;
  requires_acknowledgement: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  view_count: number;
  click_count: number;
  acknowledgement_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementListResponse {
  items: AnnouncementRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActiveAnnouncement {
  id: string;
  title: string;
  body: string;
  action_url: string | null;
  requires_acknowledgement: boolean;
  published_at: string | null;
  viewed: boolean;
  acknowledged: boolean;
}

export async function listAdminAnnouncements(params?: {
  status?: AnnouncementStatus;
  limit?: number;
  offset?: number;
}): Promise<AnnouncementListResponse> {
  const { data } = await api.get<ApiEnvelope<AnnouncementListResponse>>('/admin/announcements', { params });
  return data.data;
}

export async function createAnnouncement(body: {
  title: string;
  body: string;
  target_type: AnnouncementTarget;
  target_laundry_ids?: string[];
  target_cities?: string[];
  channel_in_app?: boolean;
  channel_email?: boolean;
  channel_push?: boolean;
  action_url?: string | null;
  requires_acknowledgement?: boolean;
  scheduled_at?: string | null;
}): Promise<AnnouncementRow> {
  const { data } = await api.post<ApiEnvelope<AnnouncementRow>>('/admin/announcements', body);
  return data.data;
}

export async function updateAnnouncement(
  id: string,
  body: Partial<{
    title: string;
    body: string;
    target_type: AnnouncementTarget;
    target_laundry_ids: string[];
    target_cities: string[];
    channel_in_app: boolean;
    channel_email: boolean;
    channel_push: boolean;
    action_url: string | null;
    requires_acknowledgement: boolean;
    scheduled_at: string | null;
  }>,
): Promise<AnnouncementRow> {
  const { data } = await api.patch<ApiEnvelope<AnnouncementRow>>(`/admin/announcements/${id}`, body);
  return data.data;
}

export async function publishAnnouncement(id: string): Promise<AnnouncementRow> {
  const { data } = await api.post<ApiEnvelope<AnnouncementRow>>(`/admin/announcements/${id}/publish`);
  return data.data;
}

export async function scheduleAnnouncement(id: string, scheduled_at: string): Promise<AnnouncementRow> {
  const { data } = await api.post<ApiEnvelope<AnnouncementRow>>(`/admin/announcements/${id}/schedule`, {
    scheduled_at,
  });
  return data.data;
}

export async function archiveAnnouncement(id: string): Promise<AnnouncementRow> {
  const { data } = await api.post<ApiEnvelope<AnnouncementRow>>(`/admin/announcements/${id}/archive`);
  return data.data;
}

export async function getActiveAnnouncements(): Promise<ActiveAnnouncement[]> {
  const { data } = await api.get<ApiEnvelope<ActiveAnnouncement[]>>('/announcements/active');
  return data.data;
}

export async function recordAnnouncementEvent(
  id: string,
  event_type: 'view' | 'click' | 'acknowledge',
): Promise<{ recorded: boolean; view_count: number; click_count: number; acknowledgement_count: number }> {
  const { data } = await api.post<
    ApiEnvelope<{ recorded: boolean; view_count: number; click_count: number; acknowledgement_count: number }>
  >(`/announcements/${id}/events`, { event_type });
  return data.data;
}

export const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all_users: 'All users',
  customers: 'Customers',
  partners: 'Partners',
  specific_laundries: 'Specific laundries',
  specific_cities: 'Specific cities',
};

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};
