'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const BASE_PAGE_SIZES = [10, 25, 50, 100] as const;
const PERF_PAGE_SIZES = [1000, 10000] as const;

function getPageSizeOptions(): readonly number[] {
  const mock = Number(process.env.NEXT_PUBLIC_TABLE_PERF_MOCK_ROWS ?? 0);
  if (mock > 500) return [...BASE_PAGE_SIZES, ...PERF_PAGE_SIZES];
  return BASE_PAGE_SIZES;
}

type DataTablePaginationProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  pageStart: number;
  pageEnd: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  pageStart,
  pageEnd,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  if (totalCount === 0) return null;

  const from = totalCount === 0 ? 0 : pageStart + 1;
  const to = pageEnd;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 w-[5.5rem] min-h-9 py-1 text-sm"
            aria-label="Rows per page"
          >
            {getPageSizeOptions().map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
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
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
