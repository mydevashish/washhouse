'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DEFAULT_PAGE_SIZE, type PaginatedList } from '@/lib/pagination/types';
import { cn } from '@/lib/utils';

export type PartnerHubWorkspacePaginationProps = {
  page: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  page_size?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Modal footer pagination — fixed page size (default 10), no page-size selector. */
export function PartnerHubWorkspacePagination({
  page,
  total_records,
  total_pages,
  has_next,
  has_previous,
  page_size = DEFAULT_PAGE_SIZE,
  onPageChange,
  className,
}: PartnerHubWorkspacePaginationProps) {
  if (total_records <= 0) return null;

  const pageCount = Math.max(1, total_pages);
  const pageStart = (page - 1) * page_size;
  const from = pageStart + 1;
  const to = Math.min(pageStart + page_size, total_records);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      data-testid="hub-workspace-pagination"
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total_records}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-h-9"
          disabled={!has_previous || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <span className="min-w-[7rem] px-2 text-center text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-h-9"
          disabled={!has_next || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function partnerHubPaginationFromList<T>(
  data: Pick<
    PaginatedList<T>,
    'page' | 'page_size' | 'total_records' | 'total_pages' | 'has_next' | 'has_previous'
  >,
): Omit<PartnerHubWorkspacePaginationProps, 'onPageChange' | 'className'> {
  return {
    page: data.page,
    page_size: data.page_size,
    total_records: data.total_records,
    total_pages: data.total_pages,
    has_next: data.has_next,
    has_previous: data.has_previous,
  };
}
