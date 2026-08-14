'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GarmentCatalogItem } from '@/services/partner-garment-catalog';

export function GarmentDeleteDialog({
  item,
  open,
  deleting,
  onOpenChange,
  onConfirm,
}: {
  item: GarmentCatalogItem | null;
  open: boolean;
  deleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="garment-delete-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove garment?</DialogTitle>
          <DialogDescription>
            {item
              ? `“${item.name}” (${item.garment_code}) will be removed from your rate card. You can re-add it later or import from Excel.`
              : 'This garment will be removed from your rate card.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting || !item}
            data-testid="garment-delete-confirm-btn"
            onClick={onConfirm}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
