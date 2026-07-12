'use client';

import { Download, RefreshCw, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ServerListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  totalRecords?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  filterSlot?: ReactNode;
  className?: string;
};

export function ServerListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  totalRecords,
  isLoading,
  onRefresh,
  onExport,
  filterSlot,
  className,
}: ServerListToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between', className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-8"
            aria-label="Search list"
          />
        </div>
        {filterSlot}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {typeof totalRecords === 'number' ? (
          <span className="text-sm text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{totalRecords.toLocaleString()}</span> records
          </span>
        ) : null}
        {onRefresh ? (
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        ) : null}
        {onExport ? (
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={onExport}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export
          </Button>
        ) : null}
      </div>
    </div>
  );
}
