'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { partnerServiceCategoryIcon } from '@/features/partner/components/ops-visual/partner-service-icon';
import { PARTNER_BTN, PARTNER_CARD } from '@/features/partner/lib/partner-compact';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';
import { cn } from '@/lib/utils';

export function PartnerServiceTile({
  service,
  onAdd,
  disabled,
  className,
}: {
  service: ServiceCatalogItem;
  onAdd: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Icon = partnerServiceCategoryIcon(service.category);
  const rate = Number(service.price_inr);

  return (
    <div className={cn('flex flex-col shadow-sm', PARTNER_CARD, className)}>
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{service.name}</p>
          <p className="truncate text-xs text-muted-foreground">{service.category}</p>
        </div>
      </div>
      {service.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(PARTNER_BTN, 'gap-1')}
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add
        </Button>
        <span className="text-sm font-semibold tabular-nums">{formatInr(rate)}</span>
      </div>
    </div>
  );
}
