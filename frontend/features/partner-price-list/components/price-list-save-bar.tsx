'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PriceListSaveBarProps = {
  dirtyCount: number;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function PriceListSaveBar({ dirtyCount, isSaving, onSave, onDiscard }: PriceListSaveBarProps) {
  if (dirtyCount === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-pop backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-4 md:rounded-2xl md:border md:shadow-soft md:backdrop-blur-none"
      role="status"
      aria-live="polite"
      data-testid="price-list-save-bar"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{dirtyCount}</span>{' '}
          {dirtyCount === 1 ? 'item' : 'items'} changed — save to publish what customers see.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onDiscard} disabled={isSaving}>
            Discard
          </Button>
          <Button type="button" className="flex-1 sm:flex-none" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Save prices'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
