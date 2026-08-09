'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';

type Props = {
  service: ServiceCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quantity: number) => void;
};

export function PartnerNewOrderServiceAddDialog({
  service,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [qty, setQty] = useState('1');

  useEffect(() => {
    if (open) setQty('1');
  }, [open, service?.id]);

  if (!service) return null;

  const quantity = Math.max(1, Number(qty) || 1);
  const rate = Number(service.price_inr);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {service.name}</DialogTitle>
          <DialogDescription>
            {formatInr(rate)} per {service.unit || 'unit'} · {service.category}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="partner-add-service-qty">Quantity</Label>
          <Input
            id="partner-add-service-qty"
            type="number"
            min={1}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="min-h-[44px]"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-[44px]"
            onClick={() => {
              onConfirm(quantity);
              onOpenChange(false);
            }}
          >
            Add to order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
