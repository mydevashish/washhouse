/** Platform-wide paginated list response contract. */

export const DEFAULT_PAGE_SIZE = 10;
export const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof ALLOWED_PAGE_SIZES)[number];

export interface PaginatedList<T> {
  items: T[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListQueryState {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type ListQueryParams = Record<string, string | number | boolean | undefined | null>;

export function normalizePageSize(size?: number): PageSize {
  if (size && (ALLOWED_PAGE_SIZES as readonly number[]).includes(size)) {
    return size as PageSize;
  }
  return DEFAULT_PAGE_SIZE;
}

/** @deprecated Use total_records — kept for legacy settlement responses during migration */
export function getTotalRecords<T>(data: PaginatedList<T> & { total?: number }): number {
  return data.total_records ?? data.total ?? 0;
}
