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

type ApplySuggestedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function ApplySuggestedDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ApplySuggestedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply suggested WashHouse prices?</DialogTitle>
          <DialogDescription>
            This copies platform suggested rates onto items you have not priced yet. Existing prices you
            already set are left unchanged. You can edit everything afterward.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Applying…
              </>
            ) : (
              'Apply suggested prices'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
