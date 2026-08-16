'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePartnerGarmentCatalogMutations } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations';

export function GarmentBulkVisibleDialog({
  open,
  onOpenChange,
  pageIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageIds: string[];
  onSuccess?: () => void;
}) {
  const { bulkVisibleM } = usePartnerGarmentCatalogMutations();

  async function handleConfirm() {
    if (pageIds.length === 0) return;
    await bulkVisibleM.mutateAsync({ ids: pageIds });
    onOpenChange(false);
    onSuccess?.();
  }

  const count = pageIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="bulk-visible-dialog">
        <DialogHeader>
          <DialogTitle>Make all visible on this page?</DialogTitle>
          <DialogDescription>
            Make {count} garment{count === 1 ? '' : 's'} visible on this page? Hidden items will show at the counter.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="h-9"
            data-testid="bulk-visible-confirm-btn"
            disabled={bulkVisibleM.isPending || count === 0}
            onClick={() => void handleConfirm()}
          >
            {bulkVisibleM.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Make visible
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
