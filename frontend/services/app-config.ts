import { api, type ApiEnvelope } from '@/lib/api';

export type PublicAppConfig = {
  online_booking_enabled: boolean;
};

export async function getPublicAppConfig(): Promise<PublicAppConfig> {
  const { data } = await api.get<ApiEnvelope<PublicAppConfig>>('/config');
  return data.data;
}
