'use client';

import { ClipboardCheck, IndianRupee, LayoutDashboard, Package, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { HORIZONTAL_SCROLL_TOUCH_CLASS } from '@/lib/horizontal-scroll-touch';

export type AdminTab = 'overview' | 'approvals' | 'orders' | 'users' | 'revenue';

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
];

type AdminTabNavProps = {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
  badges?: Partial<Record<AdminTab, number>>;
};

export function AdminTabNav({ active, onChange, badges }: AdminTabNavProps) {
  return (
    <nav
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1',
        HORIZONTAL_SCROLL_TOUCH_CLASS,
      )}
      aria-label="Admin sections"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        const badge = badges?.[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={selected ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {badge != null && badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs font-bold text-foreground">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
