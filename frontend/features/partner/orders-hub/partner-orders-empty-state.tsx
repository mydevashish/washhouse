import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { HubMotionBlock } from '@/features/partner/orders-hub/partner-hub-motion';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

type PartnerOrdersEmptyStateProps = {
  className?: string;
  /** Narrow empty (active filters) vs cold start. */
  filtered?: boolean;
  onClearFilters?: () => void;
};

const EMPTY_IMAGE = '/catalog/heroes/fresh-laundry.webp';

export function PartnerOrdersEmptyState({
  className,
  filtered = false,
  onClearFilters,
}: PartnerOrdersEmptyStateProps) {
  return (
    <HubMotionBlock
      role="status"
      data-testid="partner-orders-empty-state"
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-card/50 px-5 py-10 text-center',
        className,
      )}
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-border/50 sm:h-28 sm:w-28">
        <Image
          src={EMPTY_IMAGE}
          alt=""
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
      <h3 className="mt-5 text-balance text-lg font-semibold text-foreground">
        {filtered ? 'No orders match these filters' : 'No orders in this view yet'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {filtered
          ? 'Try another chip or clear search to see more of your queue.'
          : 'Find a customer or start a new order — everything lives in one place.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {filtered && onClearFilters ? (
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button asChild size="sm" className="h-9">
          <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Find customer</Link>
        </Button>
        <Button asChild variant={filtered ? 'ghost' : 'outline'} size="sm" className="h-9">
          <Link href={buildOrdersHubPath('/partner/orders', 'create')}>New order</Link>
        </Button>
      </div>
    </HubMotionBlock>
  );
}
