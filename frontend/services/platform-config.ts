import { api, type ApiEnvelope } from '@/lib/api';

export interface PlatformConfig {
  commission: {
    default_rate: string;
    laundry_overrides: Array<{
      laundry_id: string;
      laundry_name: string;
      city: string;
      commission_rate: string;
    }>;
    partner_overrides: Array<{
      user_id: string;
      email: string | null;
      full_name: string;
      commission_rate: string;
    }>;
  };
  order: {
    min_amount_inr: string;
    max_amount_inr: string;
    pickup_radius_km: string;
    delivery_radius_km: string;
  };
  dispute: {
    dispute_window_hours: string;
    refund_window_hours: string;
    sla_hours: Record<string, number>;
  };
  session: {
    idle_timeout_minutes: string;
    warning_timeout_minutes: string;
  };
  notification: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
  };
}

export interface ConfigAuditRow {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string | null;
  category: string | null;
  key: string | null;
  old_value: string | null;
  new_value: string | null;
  action: string;
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const { data } = await api.get<ApiEnvelope<PlatformConfig>>('/admin/platform-config');
  return data.data;
}

export async function getPlatformConfigAudit(limit = 50): Promise<ConfigAuditRow[]> {
  const { data } = await api.get<ApiEnvelope<ConfigAuditRow[]>>('/admin/platform-config/audit', {
    params: { limit },
  });
  return data.data;
}

export async function updateDefaultCommission(rate: number): Promise<{ default_rate: string }> {
  const { data } = await api.put<ApiEnvelope<{ default_rate: string }>>('/admin/platform-config/commission/default', {
    rate,
  });
  return data.data;
}

export async function updateLaundryCommission(
  laundryId: string,
  rate: number | null,
): Promise<{ laundry_id: string; commission_rate: string | null }> {
  const { data } = await api.patch<ApiEnvelope<{ laundry_id: string; commission_rate: string | null }>>(
    `/admin/platform-config/commission/laundry/${laundryId}`,
    { rate },
  );
  return data.data;
}

export async function setPartnerCommission(body: {
  email?: string;
  user_id?: string;
  rate: number;
}): Promise<{ user_id: string; email: string | null; full_name: string; commission_rate: string }> {
  const { data } = await api.put<ApiEnvelope<{ user_id: string; email: string | null; full_name: string; commission_rate: string }>>(
    '/admin/platform-config/commission/partner',
    body,
  );
  return data.data;
}

export async function removePartnerCommission(userId: string): Promise<void> {
  await api.delete(`/admin/platform-config/commission/partner/${userId}`);
}

export async function updateOrderSettings(body: {
  min_amount_inr: number;
  max_amount_inr: number;
  pickup_radius_km: number;
  delivery_radius_km: number;
}): Promise<Record<string, string>> {
  const { data } = await api.put<ApiEnvelope<Record<string, string>>>('/admin/platform-config/order', body);
  return data.data;
}

export async function updateDisputeSettings(body: {
  dispute_window_hours: number;
  refund_window_hours: number;
  sla_hours: Record<string, number>;
}): Promise<Record<string, unknown>> {
  const { data } = await api.put<ApiEnvelope<Record<string, unknown>>>('/admin/platform-config/dispute', body);
  return data.data;
}

export async function updateSessionSettings(body: {
  idle_timeout_minutes: number;
  warning_timeout_minutes: number;
}): Promise<Record<string, number>> {
  const { data } = await api.put<ApiEnvelope<Record<string, number>>>('/admin/platform-config/session', body);
  return data.data;
}

export async function updateNotificationSettings(body: {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
}): Promise<Record<string, boolean>> {
  const { data } = await api.put<ApiEnvelope<Record<string, boolean>>>('/admin/platform-config/notifications', body);
  return data.data;
}

export async function getPublicSessionConfig(): Promise<{ idle_timeout_minutes: number; warning_timeout_minutes: number }> {
  const { data } = await api.get<ApiEnvelope<{ idle_timeout_minutes: number; warning_timeout_minutes: number }>>('/config/session');
  return data.data;
}
