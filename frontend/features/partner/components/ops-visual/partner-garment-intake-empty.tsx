'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PartnerGarmentAddTile } from '@/features/partner/components/ops-visual/partner-garment-add-tile';
import { cn } from '@/lib/utils';

type PartnerGarmentIntakeEmptyProps = {
  onAddGarments: () => void;
  onApplySuggested?: () => void;
  applyPending?: boolean;
  className?: string;
};

export function PartnerGarmentIntakeEmpty({
  onAddGarments,
  onApplySuggested,
  applyPending,
  className,
}: PartnerGarmentIntakeEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center sm:flex-row sm:text-left',
        className,
      )}
      data-testid="partner-garment-intake-empty"
    >
      <PartnerGarmentAddTile
        onClick={onAddGarments}
        className="min-h-[7rem] w-full max-w-[12rem] sm:shrink-0"
        label="Add garments"
      />
      <div className="min-w-0 space-y-2">
        <p className="font-medium text-foreground">No garments on your counter wall yet</p>
        <p className="text-sm text-muted-foreground">
          Add shirt, pant, saree, and other piece items from the WashHouse catalog with your dry-clean
          and press rates. You can also manage everything under Garment prices.
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={onAddGarments}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add garments
          </Button>
          {onApplySuggested ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9"
              disabled={applyPending}
              onClick={onApplySuggested}
            >
              Apply suggested prices
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
