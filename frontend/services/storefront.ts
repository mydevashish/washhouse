import { api, type ApiEnvelope } from '@/lib/api';
import { mediaUrl } from '@/lib/media-url';

export interface StorefrontGalleryItem {
  id: string;
  url: string;
  category: string;
  sort_order: number;
  is_featured: boolean;
  caption?: string | null;
}

export interface StorefrontHighlight {
  title: string;
  description?: string | null;
}

export interface StorefrontMachine {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  image_url?: string | null;
}

export interface StorefrontTeamMember {
  id: string;
  name: string;
  role: string;
  description?: string | null;
  photo_url?: string | null;
}

export interface StorefrontCertification {
  id: string;
  title: string;
  issuer?: string | null;
  image_url?: string | null;
}

export interface StorefrontVideo {
  id: string;
  title: string;
  url: string;
  video_type: string;
}

export interface StorefrontData {
  laundry_id: string;
  template_id: string;
  is_published: boolean;
  logo_url: string | null;
  cover_url: string | null;
  brand_primary: string | null;
  brand_secondary: string | null;
  tagline: string | null;
  brand_story: string | null;
  years_in_business: number | null;
  owner_name: string | null;
  contact_phone: string | null;
  whatsapp_number?: string | null;
  show_call?: boolean;
  show_whatsapp?: boolean;
  show_callback?: boolean;
  approval_status?: string;
  working_hours: Record<string, string> | null;
  pickup_radius_km: string | null;
  delivery_radius_km: string | null;
  facilities: string[];
  highlights: StorefrontHighlight[];
  gallery: StorefrontGalleryItem[];
  machines: StorefrontMachine[];
  team: StorefrontTeamMember[];
  certifications: StorefrontCertification[];
  videos: StorefrontVideo[];
  completeness_score: number;
}

export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  brand_primary: string;
  brand_secondary: string;
  sample_facilities: string[];
  sample_highlights: StorefrontHighlight[];
}

export interface PublicStorefront {
  storefront: StorefrontData;
  laundry: {
    id: string;
    name: string;
    slug: string;
    city: string;
    address_line: string;
    description: string | null;
    avg_rating: string;
    review_count: number;
    is_verified: boolean;
    services: Array<{
      id: string;
      name: string;
      category: string;
      unit: string;
      price_inr: string;
      is_active: boolean;
    }>;
  };
  orders_completed: number;
  services: PublicStorefront['laundry']['services'];
}

export function resolveStorefrontImage(url: string | null | undefined): string {
  if (!url) return '';
  return mediaUrl(url);
}

export async function getPartnerStorefront(): Promise<StorefrontData> {
  const { data } = await api.get<ApiEnvelope<StorefrontData>>('/partner/storefront');
  return data.data;
}

export async function updatePartnerStorefront(
  patch: Partial<StorefrontData>,
): Promise<StorefrontData> {
  const { data } = await api.put<ApiEnvelope<StorefrontData>>('/partner/storefront', patch);
  return data.data;
}

export async function applyStorefrontTemplate(templateId: string): Promise<StorefrontData> {
  const { data } = await api.post<ApiEnvelope<StorefrontData>>(
    '/partner/storefront/apply-template',
    { template_id: templateId },
  );
  return data.data;
}

export async function listStorefrontTemplates(): Promise<StorefrontTemplate[]> {
  const { data } = await api.get<ApiEnvelope<StorefrontTemplate[]>>('/partner/storefront/templates');
  return data.data;
}

export async function getStorefrontOptions(): Promise<{
  facilities: string[];
  gallery_categories: string[];
}> {
  const { data } = await api.get<ApiEnvelope<{ facilities: string[]; gallery_categories: string[] }>>(
    '/partner/storefront/options',
  );
  return data.data;
}

export async function uploadStorefrontImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<{ url: string }>>('/partner/storefront/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url;
}

export async function getPublicStorefront(laundryId: string): Promise<PublicStorefront> {
  const { data } = await api.get<ApiEnvelope<PublicStorefront>>(`/laundries/${laundryId}/storefront`);
  return data.data;
}
