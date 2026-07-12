'use client';

import { Clock, Minus, Plus, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getServiceMeta } from '@/features/discover/detail/service-icons';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { LaundryServiceItem } from '@/services/laundries';
import { cn } from '@/lib/utils';

type ServiceCardProps = {
  service: LaundryServiceItem;
  quantity: number;
  onSelect: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onQuantityChange: (qty: number) => void;
  browseOnly?: boolean;
};

export function ServiceCard({
  service,
  quantity,
  onSelect,
  onIncrement,
  onDecrement,
  onQuantityChange,
  browseOnly = false,
}: ServiceCardProps) {
  const { icon: Icon, description, deliveryText, unitLabel } = getServiceMeta(service);
  const selected = quantity > 0;
  const unitPrice = Number(service.price_inr);
  const lineTotal = unitPrice * quantity;

  function handleQuantityInput(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) {
      onQuantityChange(0);
      return;
    }
    onQuantityChange(Math.min(n, 99));
  }

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-base',
        selected
          ? 'border-primary shadow-[var(--shadow-card-hover)] ring-2 ring-primary/15'
          : 'border-border hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]',
      )}
    >
      <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-sky-500/10 text-primary">
            <Icon className="h-7 w-7" aria-hidden />
          </div>
          {selected && !browseOnly && (
            <span className="rounded-full bg-success-muted px-3 py-1 text-xs font-bold text-success">
              In cart
            </span>
          )}
        </div>

        <h3 className="mt-4 text-xl font-bold text-foreground">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {service.description || description}
        </p>
        {service.express_available && (
          <span className="mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">
            Express available
          </span>
        )}

        <div className="mt-5 flex items-end justify-between gap-2 rounded-2xl bg-muted/60 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Price
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatInr(unitPrice)}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{unitLabel}</p>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 rounded-xl bg-sky-500/10 px-3 py-2 text-sm text-foreground">
          <Clock className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          {service.estimated_duration_minutes
            ? `~${service.estimated_duration_minutes} min · ${deliveryText}`
            : deliveryText}
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-3 border-t border-border bg-background p-4 sm:p-5">
        {browseOnly ? null : selected ? (
          <>
            <div className="w-full">
              <Label htmlFor={`qty-${service.id}`} className="text-xs font-medium text-muted-foreground">
                Quantity
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  aria-label={`Decrease ${service.name}`}
                  onClick={onDecrement}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id={`qty-${service.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  className="h-12 rounded-xl text-center text-lg font-bold"
                  aria-live="polite"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  aria-label={`Increase ${service.name}`}
                  onClick={onIncrement}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {quantity > 0 && (
                <p className="mt-2 text-right text-sm font-bold text-foreground">
                  Subtotal {formatInr(lineTotal)}
                </p>
              )}
            </div>
          </>
        ) : (
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-bold"
            size="lg"
            onClick={onSelect}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            Add service
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
