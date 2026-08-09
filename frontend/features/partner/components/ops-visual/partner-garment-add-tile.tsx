'use client';

import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

type PartnerGarmentAddTileProps = {
  onClick: () => void;
  className?: string;
  label?: string;
};

/** Dashed “+” tile on the garment wall — opens catalog offer dialog. */
export function PartnerGarmentAddTile({
  onClick,
  className,
  label = 'Add garment',
}: PartnerGarmentAddTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-2xl',
        'border-2 border-dashed border-border/80 bg-muted/20 p-3 text-center',
        'text-sm font-medium text-muted-foreground transition-colors',
        'hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      data-testid="partner-garment-add-tile"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-background ring-1 ring-border/60">
        <Plus className="h-5 w-5" aria-hidden />
      </span>
      {label}
    </button>
  );
}
