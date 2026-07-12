import { api, type ApiEnvelope } from '@/lib/api';
import { mediaUrl } from '@/lib/media-url';

export interface DeliveryProofDeviceInfo {
  user_agent?: string | null;
  platform?: string | null;
  language?: string | null;
  screen?: string | null;
  timezone?: string | null;
  [key: string]: unknown;
}

export interface DeliveryProofPhoto {
  id: string;
  order_id: string;
  customer_id: string;
  laundry_id: string;
  captured_at: string;
  latitude: string | null;
  longitude: string | null;
  uploaded_by_user_id: string;
  uploaded_by_name?: string | null;
  device_info: DeliveryProofDeviceInfo | null;
  created_at: string;
  original_url: string;
  compressed_url: string;
}

export interface DeliveryProofUploadResult {
  photo: DeliveryProofPhoto;
}

export function collectDeviceInfo(): DeliveryProofDeviceInfo {
  if (typeof navigator === 'undefined') return {};
  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export async function uploadDeliveryProof(
  orderId: string,
  file: File,
  meta?: { latitude?: number; longitude?: number; capturedAt?: string; deviceInfo?: DeliveryProofDeviceInfo },
): Promise<DeliveryProofUploadResult> {
  const form = new FormData();
  form.append('file', file);
  if (meta?.latitude != null) form.append('latitude', String(meta.latitude));
  if (meta?.longitude != null) form.append('longitude', String(meta.longitude));
  if (meta?.capturedAt) form.append('captured_at', meta.capturedAt);
  if (meta?.deviceInfo) form.append('device_info', JSON.stringify(meta.deviceInfo));

  const { data } = await api.post<ApiEnvelope<DeliveryProofUploadResult>>(
    `/partner/orders/${orderId}/delivery-proof`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  return data.data;
}

export async function getPartnerDeliveryProof(orderId: string): Promise<DeliveryProofPhoto | null> {
  const { data } = await api.get<ApiEnvelope<DeliveryProofPhoto | null>>(
    `/partner/orders/${orderId}/delivery-proof`,
  );
  return data.data;
}

export async function getCustomerDeliveryProof(orderId: string): Promise<DeliveryProofPhoto | null> {
  const { data } = await api.get<ApiEnvelope<DeliveryProofPhoto | null>>(`/orders/${orderId}/delivery-proof`);
  return data.data;
}

export async function getAdminDeliveryProof(orderId: string): Promise<DeliveryProofPhoto | null> {
  const { data } = await api.get<ApiEnvelope<DeliveryProofPhoto | null>>(
    `/admin/orders/${orderId}/delivery-proof`,
  );
  return data.data;
}

export async function fetchDeliveryProofImage(
  photo: DeliveryProofPhoto,
  variant: 'compressed' | 'original' = 'compressed',
): Promise<Blob> {
  const path = variant === 'original' ? photo.original_url : photo.compressed_url;
  const { data } = await api.get<Blob>(mediaUrl(path), { responseType: 'blob' });
  return data;
}
