'use client';

import { Button } from '@/components/ui/button';
import { ServiceCatalogBrowser } from '@/features/discover/detail/service-catalog-browser';
import type { LaundryServiceItem } from '@/services/laundries';

type LaundryServicesTabProps = {
  laundryId: string;
  /** Kept for callers / order summary; catalogue loads via API. */
  services: LaundryServiceItem[];
  quantities: Record<string, number>;
  onSelect: (svc: LaundryServiceItem) => void;
  onIncrement: (svc: LaundryServiceItem) => void;
  onDecrement: (svc: LaundryServiceItem) => void;
  onQuantityChange: (svc: LaundryServiceItem, qty: number) => void;
  selectedCount: number;
  onCheckout: () => void;
  browseOnly?: boolean;
};

/** Services panel — reuses storefront ServiceCatalogBrowser (chips, search, photos). */
export function LaundryServicesTab({
  laundryId,
  quantities,
  onSelect,
  onIncrement,
  onDecrement,
  onQuantityChange,
  selectedCount,
  onCheckout,
  browseOnly = false,
}: LaundryServicesTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">
          {browseOnly ? 'Price list' : 'Pick your services'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {browseOnly
            ? 'All prices in INR. Contact the shop by phone or WhatsApp to place your order.'
            : 'Browse every category this store offers, add what you need, then schedule free pickup.'}
        </p>
      </div>

      <ServiceCatalogBrowser
        laundryId={laundryId}
        quantities={quantities}
        onSelect={onSelect}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onQuantityChange={onQuantityChange}
        browseOnly={browseOnly}
      />

      {!browseOnly && selectedCount > 0 && (
        <div className="hidden lg:block">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-2xl text-base font-bold"
            onClick={onCheckout}
          >
            Continue to checkout
          </Button>
        </div>
      )}
    </div>
  );
}
