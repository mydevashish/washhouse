'use client';

import { Button } from '@/components/ui/button';
import { HORIZONTAL_SCROLL_TOUCH_CLASS } from '@/lib/horizontal-scroll-touch';
import { cn } from '@/lib/utils';

export type LaundryTabId = 'overview' | 'services' | 'reviews' | 'information';

const TABS: { id: LaundryTabId; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'About this store' },
  { id: 'services', label: 'Services', hint: 'Prices & booking' },
  { id: 'reviews', label: 'Reviews', hint: 'Customer feedback' },
  { id: 'information', label: 'Information', hint: 'Hours & policies' },
];

type LaundryDetailTabsProps = {
  active: LaundryTabId;
  onChange: (tab: LaundryTabId) => void;
  reviewCount: number;
};

export function LaundryDetailTabs({ active, onChange, reviewCount }: LaundryDetailTabsProps) {
  return (
    <div
      className={cn(
        'sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border sm:shadow-soft sm:backdrop-blur-none',
        HORIZONTAL_SCROLL_TOUCH_CLASS,
      )}
      role="tablist"
      aria-label="Laundry sections"
    >
      <div
        className={cn(
          'flex gap-1 overflow-x-auto py-2 sm:p-1',
          HORIZONTAL_SCROLL_TOUCH_CLASS,
        )}
      >
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            variant={active === t.id ? 'default' : 'ghost'}
            onClick={() => onChange(t.id)}
            className={cn(
              'min-w-[7rem] h-auto shrink-0 rounded-lg px-4 py-3 text-left sm:min-w-0 sm:flex-1 sm:text-center',
              active !== t.id && 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="block text-sm font-semibold">
              {t.label}
              {t.id === 'reviews' && reviewCount > 0 && (
                <span className={cn('ml-1.5', active === t.id ? 'text-button-foreground/80' : '')}>
                  ({reviewCount})
                </span>
              )}
            </span>
            <span
              className={cn(
                'mt-0.5 hidden text-xs sm:block',
                active === t.id ? 'text-button-foreground/80' : 'text-muted-foreground',
              )}
            >
              {t.hint}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
