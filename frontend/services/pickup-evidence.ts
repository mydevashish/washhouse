import { api, type ApiEnvelope } from '@/lib/api';
import { mediaUrl } from '@/lib/media-url';

export interface PickupEvidencePhoto {
  id: string;
  order_id: string;
  customer_id: string;
  laundry_id: string;
  captured_at: string;
  latitude: string | null;
  longitude: string | null;
  uploaded_by_user_id: string;
  uploaded_by_name?: string | null;
  sort_index: number;
  created_at: string;
  original_url: string;
  compressed_url: string;
}

export interface PickupEvidenceUploadResult {
  photos: PickupEvidencePhoto[];
  count: number;
}

export async function uploadPickupEvidence(
  orderId: string,
  files: File[],
  meta?: { latitude?: number; longitude?: number; capturedAt?: string },
): Promise<PickupEvidenceUploadResult> {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }
  if (meta?.latitude != null) form.append('latitude', String(meta.latitude));
  if (meta?.longitude != null) form.append('longitude', String(meta.longitude));
  if (meta?.capturedAt) form.append('captured_at', meta.capturedAt);

  const { data } = await api.post<ApiEnvelope<PickupEvidenceUploadResult>>(
    `/partner/orders/${orderId}/pickup-evidence`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  return data.data;
}

export async function listPartnerPickupEvidence(orderId: string): Promise<PickupEvidencePhoto[]> {
  const { data } = await api.get<ApiEnvelope<PickupEvidencePhoto[]>>(
    `/partner/orders/${orderId}/pickup-evidence`,
  );
  return data.data;
}

export async function listCustomerPickupEvidence(orderId: string): Promise<PickupEvidencePhoto[]> {
  const { data } = await api.get<ApiEnvelope<PickupEvidencePhoto[]>>(`/orders/${orderId}/pickup-evidence`);
  return data.data;
}

export async function listAdminPickupEvidence(orderId: string): Promise<PickupEvidencePhoto[]> {
  const { data } = await api.get<ApiEnvelope<PickupEvidencePhoto[]>>(
    `/admin/orders/${orderId}/pickup-evidence`,
  );
  return data.data;
}

/** Fetch protected image bytes (requires Authorization header). */
export async function fetchPickupEvidenceImage(
  photo: PickupEvidencePhoto,
  variant: 'compressed' | 'original' = 'compressed',
): Promise<Blob> {
  const path = variant === 'original' ? photo.original_url : photo.compressed_url;
  const { data } = await api.get<Blob>(mediaUrl(path), { responseType: 'blob' });
  return data;
}
