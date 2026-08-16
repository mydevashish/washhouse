import { api, type ApiEnvelope } from '@/lib/api';
import type { PaginatedList } from '@/lib/pagination/types';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination/types';
import type { AxiosError } from 'axios';

/** Default page size for garment catalog — aligned with pagination standard. */
export const GARMENT_CATALOG_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/** Excel `Category` column values (normalized slug). */
export type GarmentCategory =
  | 'men'
  | 'women'
  | 'kids'
  | 'household'
  | 'institutional'
  | 'others';

/** Service-type price columns from Default.xls / backend enum. */
export type GarmentServiceType =
  | 'commercial_service'
  | 'dry_cleaning'
  | 'express_service'
  | 'on_hanger'
  | 'lint_remover'
  | 'premium_laundry'
  | 'shoe_cleaning'
  | 'steam_press'
  | 'starch'
  | 'wash_and_fold'
  | 'wash_n_iron';

export const GARMENT_SERVICE_TYPES: readonly GarmentServiceType[] = [
  'commercial_service',
  'dry_cleaning',
  'express_service',
  'on_hanger',
  'lint_remover',
  'premium_laundry',
  'shoe_cleaning',
  'steam_press',
  'starch',
  'wash_and_fold',
  'wash_n_iron',
] as const;

export const GARMENT_CATEGORIES: readonly { id: GarmentCategory; label: string }[] = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
  { id: 'household', label: 'Household' },
  { id: 'institutional', label: 'Institutional' },
  { id: 'others', label: 'Others' },
] as const;

/** Primary counter columns shown first in UI (Prompt 6). */
export const GARMENT_PRIMARY_SERVICE_TYPES: readonly GarmentServiceType[] = [
  'dry_cleaning',
  'steam_press',
  'shoe_cleaning',
] as const;

export type GarmentServiceRate = {
  price_inr: string | null;
  price_paise: number | null;
};

export type GarmentCatalogItem = {
  id: string;
  laundry_id: string;
  category: GarmentCategory;
  name: string;
  garment_code: string;
  image_url: string | null;
  resolved_image_url: string | null;
  platform_catalog_item_id: string | null;
  is_visible: boolean;
  sort_order: number;
  rates: Partial<Record<GarmentServiceType, GarmentServiceRate>>;
  created_at?: string;
  updated_at?: string;
};

export type GarmentCatalogListParams = {
  category?: GarmentCategory;
  search?: string;
  page?: number;
  page_size?: number;
};

export type GarmentCatalogSummary = {
  total: number;
  visible: number;
  categories: number;
};

export type GarmentCatalogCreateInput = {
  name: string;
  garment_code: string;
  category: GarmentCategory;
  image_url?: string | null;
  platform_catalog_item_id?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  rates?: Partial<Record<GarmentServiceType, number | string | null>>;
};

export type GarmentCatalogUpdateInput = Partial<GarmentCatalogCreateInput>;

export type GarmentImportMode = 'upsert' | 'replace_categories_in_file' | 'replace_all';

export type GarmentImportPreviewRow = {
  row_number: number;
  garment_code: string;
  name: string;
  category: GarmentCategory;
  is_visible: boolean;
  rates: Partial<Record<GarmentServiceType, number>>;
};

export type GarmentImportErrorRow = {
  row_number: number;
  garment_code: string | null;
  name: string | null;
  errors: string[];
};

export type GarmentImportSummary = {
  total_rows: number;
  valid_count: number;
  error_count: number;
  create_count: number;
  update_count: number;
};

export type GarmentImportPreviewResult = {
  preview_id: string;
  summary: GarmentImportSummary;
  valid_rows: GarmentImportPreviewRow[];
  error_rows: GarmentImportErrorRow[];
};

export type GarmentImportConfirmInput = {
  preview_id: string;
  mode?: GarmentImportMode;
  skip_invalid?: boolean;
};

export type GarmentImportConfirmResult = {
  imported_count: number;
  created_count: number;
  updated_count: number;
  skipped_error_count: number;
};

export type GarmentBulkDeleteInput =
  | { ids: string[]; category?: never; all?: never; confirm?: never }
  | { category: GarmentCategory; ids?: never; all?: never; confirm?: never }
  | { all: true; confirm: 'DELETE'; ids?: never; category?: never };

export type GarmentBulkDeleteResult = {
  deleted_count: number;
};

export type GarmentBulkVisibleInput = {
  ids: string[];
};

export type GarmentBulkVisibleResult = {
  updated_count: number;
};

export type GarmentImageUploadResult = {
  url: string;
  garment: GarmentCatalogItem;
};

export type PaginatedGarmentCatalog = PaginatedList<GarmentCatalogItem>;

function buildListParams(params: GarmentCatalogListParams = {}) {
  const { category, search, page = 1, page_size = GARMENT_CATALOG_DEFAULT_PAGE_SIZE } = params;
  return {
    ...(category ? { category } : {}),
    ...(search?.trim() ? { search: search.trim() } : {}),
    page,
    page_size,
  };
}

export async function listPartnerGarments(
  params: GarmentCatalogListParams = {},
): Promise<PaginatedGarmentCatalog> {
  const { data } = await api.get<ApiEnvelope<PaginatedGarmentCatalog>>('/partner/garment-catalog', {
    params: buildListParams(params),
  });
  return data.data;
}

export async function getPartnerGarmentCatalogSummary(): Promise<GarmentCatalogSummary> {
  const { data } = await api.get<ApiEnvelope<GarmentCatalogSummary>>('/partner/garment-catalog/summary');
  return data.data;
}

export async function getPartnerGarment(id: string): Promise<GarmentCatalogItem> {
  const { data } = await api.get<ApiEnvelope<GarmentCatalogItem>>(`/partner/garment-catalog/${id}`);
  return data.data;
}

async function blobToText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    try {
      return await blob.text();
    } catch {
      // fall through for partial Blob implementations
    }
  }
  if (typeof Response !== 'undefined') {
    return new Response(blob).text();
  }
  const buffer = await blob.arrayBuffer();
  return new TextDecoder().decode(buffer);
}

/** Parse JSON error body when axios used responseType blob. */
async function parseBlobApiError(blob: Blob): Promise<string | null> {
  try {
    const text = await blobToText(blob);
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message ?? null;
  } catch {
    return null;
  }
}

function filenameFromContentDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return match?.[1]?.trim().replace(/^"|"$/g, '') || fallback;
}

function isJsonBlob(blob: Blob, contentType?: string): boolean {
  const type = contentType ?? blob.type ?? '';
  return type.includes('application/json') || type.includes('text/json');
}

function isBlobLike(value: unknown): value is Blob {
  return (
    value instanceof Blob ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as Blob).arrayBuffer === 'function')
  );
}

/** Trigger browser download of the xlsx import template. */
export async function downloadGarmentTemplate(filename = 'garment-catalog-template.xlsx'): Promise<void> {
  try {
    const response = await api.get<Blob>('/partner/garment-catalog/template', {
      responseType: 'blob',
    });
    const blob = response.data;
    const contentType = String(response.headers['content-type'] ?? '');

    if (isJsonBlob(blob, contentType)) {
      const message = await parseBlobApiError(blob);
      throw new Error(message ?? 'Could not download template');
    }

    const resolvedFilename = filenameFromContentDisposition(
      response.headers['content-disposition'] as string | undefined,
      filename,
    );
    triggerBlobDownload(blob, resolvedFilename);
  } catch (error) {
    const ax = error as AxiosError<Blob | string>;
    const payload = ax.response?.data;
    if (isBlobLike(payload)) {
      const message = await parseBlobApiError(payload);
      if (message) throw new Error(message);
    } else if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload) as { error?: { message?: string } };
        if (parsed.error?.message) throw new Error(parsed.error.message);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== 'Unexpected token') throw parseError;
      }
    }
    if (error instanceof Error) throw error;
    throw new Error('Could not download template');
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function previewGarmentImport(file: File): Promise<GarmentImportPreviewResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<GarmentImportPreviewResult>>(
    '/partner/garment-catalog/import/preview',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function confirmGarmentImport(
  input: GarmentImportConfirmInput,
): Promise<GarmentImportConfirmResult> {
  const { data } = await api.post<ApiEnvelope<GarmentImportConfirmResult>>(
    '/partner/garment-catalog/import',
    {
      preview_id: input.preview_id,
      mode: input.mode ?? 'upsert',
      skip_invalid: input.skip_invalid ?? true,
    },
  );
  return data.data;
}

export async function createPartnerGarment(input: GarmentCatalogCreateInput): Promise<GarmentCatalogItem> {
  const { data } = await api.post<ApiEnvelope<GarmentCatalogItem>>('/partner/garment-catalog', input);
  return data.data;
}

export async function updatePartnerGarment(
  id: string,
  input: GarmentCatalogUpdateInput,
): Promise<GarmentCatalogItem> {
  const { data } = await api.patch<ApiEnvelope<GarmentCatalogItem>>(`/partner/garment-catalog/${id}`, input);
  return data.data;
}

export async function deletePartnerGarment(id: string): Promise<void> {
  await api.delete(`/partner/garment-catalog/${id}`);
}

export async function bulkDeletePartnerGarments(
  input: GarmentBulkDeleteInput,
): Promise<GarmentBulkDeleteResult> {
  const { data } = await api.post<ApiEnvelope<GarmentBulkDeleteResult>>(
    '/partner/garment-catalog/bulk-delete',
    input,
  );
  return data.data;
}

export async function bulkSetGarmentsVisible(input: GarmentBulkVisibleInput): Promise<GarmentBulkVisibleResult> {
  const { data } = await api.post<ApiEnvelope<GarmentBulkVisibleResult>>(
    '/partner/garment-catalog/bulk-visible',
    input,
  );
  return data.data;
}

export async function uploadGarmentImage(id: string, file: File): Promise<GarmentImageUploadResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<GarmentImageUploadResult>>(
    `/partner/garment-catalog/${id}/image`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

/** First non-zero primary service price for KPI / card subtitle. */
export function garmentPrimaryPriceInr(item: GarmentCatalogItem): string | null {
  const rates = item.rates ?? {};
  for (const key of GARMENT_PRIMARY_SERVICE_TYPES) {
    const rate = rates[key];
    if (rate?.price_inr) return rate.price_inr;
  }
  for (const key of GARMENT_SERVICE_TYPES) {
    const rate = rates[key];
    if (rate?.price_inr) return rate.price_inr;
  }
  return null;
}

/** Human label for service type slug. */
export function garmentServiceTypeLabel(type: GarmentServiceType): string {
  const labels: Record<GarmentServiceType, string> = {
    commercial_service: 'Commercial',
    dry_cleaning: 'Dry clean',
    express_service: 'Express',
    on_hanger: 'On hanger',
    lint_remover: 'Lint remover',
    premium_laundry: 'Premium laundry',
    shoe_cleaning: 'Shoe clean',
    steam_press: 'Steam press',
    starch: 'Starch',
    wash_and_fold: 'Wash & fold',
    wash_n_iron: 'Wash & iron',
  };
  return labels[type];
}
