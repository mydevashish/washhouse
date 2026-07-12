import { api, type ApiEnvelope } from '@/lib/api';

export type SessionInfo = {
  server_instance_id: string;
  force_logout_on_restart: boolean;
};

export async function fetchSessionInfo(): Promise<SessionInfo> {
  const { data } = await api.get<ApiEnvelope<SessionInfo>>('/auth/session-info');
  return data.data;
}
