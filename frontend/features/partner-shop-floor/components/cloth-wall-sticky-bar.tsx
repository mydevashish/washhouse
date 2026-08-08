'use client';

import { formatInr } from '@/features/discover/detail/order-pricing';
import { Button } from '@/components/ui/button';

type ClothWallStickyBarProps = {
  pieceCount: number;
  subtotalInr: number;
  onContinue: () => void;
  continueLabel?: string;
  disabled?: boolean;
};

export function ClothWallStickyBar({
  pieceCount,
  subtotalInr,
  onContinue,
  continueLabel = 'Aage badho',
  disabled,
}: ClothWallStickyBarProps) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6"
      data-testid="cloth-wall-sticky-bar"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">
            {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
          </p>
          <p className="text-xl font-bold tabular-nums text-foreground">
            {formatInr(subtotalInr)}
          </p>
        </div>
        <Button
          type="button"
          className="min-h-14 min-w-[8rem] px-6 text-base font-semibold"
          onClick={onContinue}
          disabled={disabled || pieceCount < 1}
        >
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}
