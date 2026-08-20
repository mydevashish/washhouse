'use client';

import { useCallback, useEffect, useId } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PartnerWalkInOrderWorkspace } from '@/features/partner/components/ops-visual/partner-walk-in-order-workspace';
import { usePartnerWalkInOrderComposer } from '@/features/partner/hooks/use-partner-walk-in-order-composer';
import type { AssistedOrderCreateResult } from '@/features/partner/customer-desk/types';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

export type PartnerCreateOrderDialogResult =
  | { kind: 'walk_in'; order: WalkInOrder }
  | { kind: 'doorstep'; order: AssistedOrderCreateResult };

type PartnerCreateOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (result: PartnerCreateOrderDialogResult) => void;
  initialName?: string;
  initialPhone?: string;
};

export function PartnerCreateOrderDialog({
  open,
  onOpenChange,
  onOrderCreated,
  initialName = '',
  initialPhone = '',
}: PartnerCreateOrderDialogProps) {
  const descriptionId = useId();
  const composer = usePartnerWalkInOrderComposer({
    initialName,
    initialPhone,
    lookupActive: true,
    lookupOnlyOnCustomerStep: false,
    debounceLookupMs: 400,
  });

  const handleDismiss = useCallback(() => {
    onOpenChange(false);
    composer.resetWorkspace();
  }, [composer, onOpenChange]);

  useEffect(() => {
    if (!open) {
      composer.resetWorkspace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when dialog closes only
  }, [open]);

  useEffect(() => {
    if (!open || !composer.createdOrder) return;
    onOrderCreated?.({ kind: 'walk_in', order: composer.createdOrder });
    onOpenChange(false);
    composer.resetWorkspace();
  }, [composer.createdOrder, onOrderCreated, onOpenChange, open, composer]);

  useEffect(() => {
    if (!open || !composer.createdDoorstepOrder) return;
    onOrderCreated?.({ kind: 'doorstep', order: composer.createdDoorstepOrder });
    onOpenChange(false);
    composer.resetWorkspace();
  }, [composer.createdDoorstepOrder, onOrderCreated, onOpenChange, open, composer]);

  const submitPending =
    composer.createMutation.isPending || composer.createDoorstepMutation.isPending;

  const footerAction = (() => {
    if (composer.step === 'customer') {
      return {
        label: 'Continue order',
        disabled: !composer.customerName.trim() || !composer.customerPhone,
        onClick: () => composer.goFromCustomer(),
      };
    }

    if (composer.step === 'intake') {
      return {
        label: 'Continue to review',
        disabled:
          composer.intakeMode === 'services'
            ? composer.serviceItems.length === 0
            : composer.garmentLines.length === 0,
        onClick: () => composer.goFromIntake(),
      };
    }

    return {
      label: submitPending ? 'Saving…' : 'Save order',
      disabled: submitPending || composer.lineRows.length === 0,
      onClick: () => composer.submitOrder(),
    };
  })();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleDismiss();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        className="flex h-[90dvh] max-h-[90dvh] w-[90vw] max-w-[90vw] gap-0 overflow-hidden p-0 sm:max-w-[90vw]"
        aria-describedby={descriptionId}
        onPointerDownOutside={(event) => {
          if (submitPending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (submitPending) event.preventDefault();
        }}
        data-testid="partner-create-order-dialog"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription id={descriptionId}>
            Phone-first intake — same flow as Customers &amp; Orders create tab. Save to assign bag
            token and print tags.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <PartnerWalkInOrderWorkspace
            composer={composer}
            embedded
            hideTopChrome
            presentation="dialog"
            suppressSuccessScreen
            lookupOnlyOnCustomerStep={false}
            debounceLookupMs={400}
          />
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-background px-5 py-3 sm:justify-between">
          <Button type="button" variant="outline" onClick={handleDismiss} disabled={submitPending}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {composer.step === 'intake' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => composer.goBackToCustomer()}
                disabled={submitPending}
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                Back
              </Button>
            )}
            {composer.step === 'review' && (
            <>
              <Button type="button" variant="outline" onClick={handleDismiss} disabled={submitPending}>
                Print invoice
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss} disabled={submitPending}>
                Print tags
              </Button>
            </>
            )}
            <Button
              type="button"
              onClick={footerAction.onClick}
              disabled={footerAction.disabled || submitPending}
              aria-busy={submitPending}
              data-testid="partner-dashboard-create-order-save"
            >
              {submitPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                footerAction.label
              )}
            </Button>
          </div>          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
