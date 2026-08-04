import { AlertTriangle, ClipboardList, Package, Truck } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type StripItem = {
  label: string;
  value: string;
  href: string;
  icon: typeof Package;
  accent?: 'default' | 'warning';
};

export function PartnerOpsFooterStrip({
  pickups,
  deliveries,
  attention,
  lowStockHint,
}: {
  pickups: number;
  deliveries: number;
  attention: number;
  lowStockHint?: string;
}) {
  const items: StripItem[] = [
    {
      label: 'Pickup orders',
      value: String(pickups),
      href: '/partner/pickups',
      icon: ClipboardList,
    },
    {
      label: 'Delivery orders',
      value: String(deliveries),
      href: '/partner/deliveries',
      icon: Truck,
    },
    {
      label: 'Needs attention',
      value: String(attention),
      href: '/partner/orders',
      icon: AlertTriangle,
      accent: attention > 0 ? 'warning' : 'default',
    },
    {
      label: 'Queue',
      value: lowStockHint ?? 'Open hub',
      href: '/partner/operations',
      icon: Package,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-border/60 transition-colors hover:bg-muted/40',
              item.accent === 'warning' && 'ring-warning/40',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
                item.accent === 'warning' && 'bg-warning-muted text-warning',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
              <p className="truncate text-sm font-semibold tabular-nums">{item.value}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
