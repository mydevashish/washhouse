'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import {
  CLOTH_WALL_MIN_QTY,
  roundClothWallQty,
} from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';

const MAX_SERVICE_QTY = 999.99;

type Props = {
  service: ServiceCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quantity: number) => void;
};

function parseServiceQtyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '.' || trimmed.endsWith('.')) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return roundClothWallQty(value);
}

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

  const parsedQty = parseServiceQtyInput(qty);
  const rate = Number(service.price_inr);
  const previewAmount =
    parsedQty != null ? formatInr(roundClothWallQty(rate * parsedQty)) : null;

  function handleConfirm() {
    const quantity = parseServiceQtyInput(qty);
    if (quantity == null || quantity < CLOTH_WALL_MIN_QTY || quantity > MAX_SERVICE_QTY) {
      toast.error(`Enter a quantity between ${CLOTH_WALL_MIN_QTY} and ${MAX_SERVICE_QTY}`);
      return;
    }
    onConfirm(quantity);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {service.name}</DialogTitle>
          <DialogDescription>
            {formatInr(rate)} per {service.unit || 'unit'} · {service.category}
            {previewAmount ? ` · Line total ${previewAmount}` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="partner-add-service-qty">Quantity</Label>
          <Input
            id="partner-add-service-qty"
            type="number"
            min={CLOTH_WALL_MIN_QTY}
            max={MAX_SERVICE_QTY}
            step="0.01"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="h-9 min-h-9"
            data-testid="partner-add-service-qty"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="h-9 min-h-9"
            onClick={handleConfirm}
            data-testid="partner-add-service-confirm"
          >
            Add to order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
