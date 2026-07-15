'use client';

import { IndianRupee, Package, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PartnerTab = 'orders' | 'customers' | 'revenue';

const TABS: { id: PartnerTab; label: string; icon: typeof Package }[] = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
];

type PartnerTabNavProps = {
  active: PartnerTab;
  onChange: (tab: PartnerTab) => void;
  badges?: Partial<Record<PartnerTab, number>>;
};

export function PartnerTabNav({ active, onChange, badges }: PartnerTabNavProps) {
  return (
    <nav
      className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/40 p-2"
      aria-label="Dashboard sections"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        const badge = badges?.[id];
        return (
          <Button
            key={id}
            type="button"
            variant={selected ? 'default' : 'ghost'}
            onClick={() => onChange(id)}
            className={cn(
              'relative h-auto min-h-[56px] flex-col gap-1 rounded-xl px-2 py-3 text-sm font-semibold',
              !selected && 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
            aria-current={selected ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
            {badge != null && badge > 0 && (
              <span
                className={cn(
                  'absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
                  selected ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground',
                )}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Button>
        );
      })}
    </nav>
  );
}
