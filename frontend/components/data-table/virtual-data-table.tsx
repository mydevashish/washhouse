'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { memo, useEffect, useRef, type ReactNode } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { recordTableRender } from '@/lib/table/table-perf';
import type { DataTableSortState } from '@/lib/table/use-data-table-state';
import { cn } from '@/lib/utils';

const ROW_HEIGHT = 44;
const OVERSCAN = 10;
const SCROLL_MAX_HEIGHT = 'min(calc(100vh - 14rem), 640px)';

export type VirtualColumnDef<T> = {
  id: string;
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
};

type VirtualDataTableProps<T> = {
  tableId: string;
  columns: VirtualColumnDef<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort: DataTableSortState;
  onToggleSort: (columnId: string) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  pageStart: number;
  pageEnd: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  emptyState: ReactNode;
  className?: string;
};

type VirtualRowProps<T> = {
  row: T;
  columns: VirtualColumnDef<T>[];
};

function VirtualRowInner<T>({ row, columns }: VirtualRowProps<T>) {
  return (
    <TableRow className="group border-border/50 hover:bg-muted/40">
      {columns.map((col) => (
        <TableCell key={col.id} className={cn('py-2.5 text-sm', col.className)}>
          {col.cell(row)}
        </TableCell>
      ))}
    </TableRow>
  );
}

const VirtualRow = memo(VirtualRowInner) as typeof VirtualRowInner;

function SortIcon({ columnId, sort }: { columnId: string; sort: DataTableSortState }) {
  if (sort.columnId !== columnId) {
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" aria-hidden />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
  );
}

export function VirtualDataTable<T>({
  tableId,
  columns,
  rows,
  getRowId,
  sort,
  onToggleSort,
  page,
  pageCount,
  pageSize,
  pageStart,
  pageEnd,
  filteredCount,
  onPageChange,
  onPageSizeChange,
  emptyState,
  className,
}: VirtualDataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const colCount = columns.length;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    getItemKey: (index) => getRowId(rows[index]!),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end
      : 0;

  useEffect(() => {
    recordTableRender(tableId, filteredCount, virtualItems.length);
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [page, pageSize, filteredCount]);

  if (rows.length === 0) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={className}>
      <div
        ref={parentRef}
        className="overflow-auto rounded-xl ring-1 ring-border/60"
        style={{ maxHeight: SCROLL_MAX_HEIGHT }}
        role="region"
        aria-label={`${tableId} table`}
        tabIndex={0}
      >
        <Table bare>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <TableRow className="border-border/60 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    'h-10 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    col.headerClassName,
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                  )}
                  onClick={col.sortable ? () => onToggleSort(col.id) : undefined}
                  aria-sort={
                    col.sortable && sort.columnId === col.id
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable ? <SortIcon columnId={col.id} sort={sort} /> : null}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 ? (
              <tr aria-hidden>
                <td colSpan={colCount} style={{ height: paddingTop, padding: 0, border: 0 }} />
              </tr>
            ) : null}
            {virtualItems.map((vItem) => (
              <VirtualRow key={vItem.key} row={rows[vItem.index]!} columns={columns} />
            ))}
            {paddingBottom > 0 ? (
              <tr aria-hidden>
                <td colSpan={colCount} style={{ height: paddingBottom, padding: 0, border: 0 }} />
              </tr>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        pageStart={pageStart}
        pageEnd={pageEnd}
        totalCount={filteredCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
