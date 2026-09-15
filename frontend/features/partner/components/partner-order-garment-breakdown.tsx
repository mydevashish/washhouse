'use client';

import { formatInr } from '@/features/discover/detail/order-pricing';
import type { OrderItem } from '@/services/orders';
import { cn } from '@/lib/utils';

type PartnerOrderGarmentBreakdownProps = {
  items: OrderItem[];
  className?: string;
  title?: string;
};

export function PartnerOrderGarmentBreakdown({
  items,
  className,
  title = 'Garments',
}: PartnerOrderGarmentBreakdownProps) {
  const withGarments = items.filter((item) => (item.garments?.length ?? 0) > 0);
  if (withGarments.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)} data-testid="partner-order-garment-breakdown">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-3">
        {withGarments.map((item, idx) => (
          <div
            key={`${item.service_name}-${idx}`}
            className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
          >
            <p className="text-sm font-medium">
              {item.service_name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatInr(Number(item.line_total_inr ?? 0))}
              </span>
            </p>
            <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
              {(item.garments ?? []).map((g) => (
                <li key={`${g.garment_item_id}-${g.garment_name}`}>
                  {g.garment_name} × {g.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
