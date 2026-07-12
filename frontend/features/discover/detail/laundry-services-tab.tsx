'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceCard } from '@/features/discover/detail/service-card';
import type { LaundryServiceItem } from '@/services/laundries';

type LaundryServicesTabProps = {
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

export function LaundryServicesTab({
  services,
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
            : 'Transparent per-kg pricing. Add to cart, then continue to schedule free pickup.'}
        </p>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No services listed for this laundry yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {services.map((svc) => (
            <li key={svc.id}>
              <ServiceCard
                service={svc}
                quantity={quantities[svc.id] ?? 0}
                onSelect={() => onSelect(svc)}
                onIncrement={() => onIncrement(svc)}
                onDecrement={() => onDecrement(svc)}
                onQuantityChange={(qty) => onQuantityChange(svc, qty)}
                browseOnly={browseOnly}
              />
            </li>
          ))}
        </ul>
      )}

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
