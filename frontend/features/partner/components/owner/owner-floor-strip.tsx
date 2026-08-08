import Link from 'next/link';
import { Package, PackageCheck, Shirt, Truck } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type FloorStat = {
  label: string;
  value: string;
  href: string;
  icon: typeof Package;
  accent?: 'default' | 'success' | 'warning';
};

export function OwnerFloorStrip({
  ordersToday,
  inProcess,
  ready,
  deliveries,
  loading,
  className,
}: {
  ordersToday: number;
  inProcess: number;
  ready: number;
  deliveries: number;
  loading?: boolean;
  className?: string;
}) {
  const items: FloorStat[] = [
    {
      label: 'Today’s orders',
      value: String(ordersToday),
      href: '/partner/orders',
      icon: Package,
    },
    {
      label: 'In process',
      value: String(inProcess),
      href: '/partner/orders',
      icon: Shirt,
    },
    {
      label: 'Ready',
      value: String(ready),
      href: '/partner/floor/ready',
      icon: PackageCheck,
      accent: ready > 0 ? 'success' : 'default',
    },
    {
      label: 'Deliveries',
      value: String(deliveries),
      href: '/partner/deliveries',
      icon: Truck,
      accent: deliveries > 0 ? 'warning' : 'default',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-2.5 lg:grid-cols-4', className)} role="list">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            role="listitem"
            className={cn(
              'flex items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 ring-1 ring-border/60 transition-colors hover:bg-muted/40',
              item.accent === 'success' && 'ring-success/35',
              item.accent === 'warning' && 'ring-warning/35',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                item.accent === 'success' && 'bg-success-muted text-success',
                item.accent === 'warning' && 'bg-warning-muted text-warning',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
              {loading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-sm font-semibold tabular-nums">{item.value}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
