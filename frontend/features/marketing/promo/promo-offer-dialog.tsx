'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  isPromoOfferActive,
  PROMO_COPY,
  PROMO_STORAGE_KEY,
} from '@/features/marketing/promo/promo-offer';

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(PROMO_STORAGE_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    window.localStorage.setItem(PROMO_STORAGE_KEY, 'dismissed');
  } catch {
    // Private mode / blocked storage — still close for this session.
  }
}

/** First-visit Dry Clean promo. Dismissal is stored in localStorage so it does not reappear on navigation. */
export function PromoOfferDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPromoOfferActive() || wasDismissed()) return;
    setOpen(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) persistDismissed();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[min(24rem,calc(100%-2rem))] overflow-hidden sm:max-w-md"
        aria-describedby="promo-offer-description"
      >
        <DialogHeader className="gap-3 pr-8">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Limited offer
          </p>
          <DialogTitle className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {PROMO_COPY.badge}
          </DialogTitle>
          <DialogDescription
            id="promo-offer-description"
            className="text-base leading-relaxed text-muted-foreground"
          >
            {PROMO_COPY.headline}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-foreground">
          <li className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="font-semibold">Applies to: </span>
            {PROMO_COPY.service}
          </li>
          <li className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="font-semibold">First 3 orders </span>
            on Dry Clean
          </li>
          <li className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            {PROMO_COPY.validity}
          </li>
        </ul>

        <Button type="button" className="h-11 w-full rounded-full" onClick={() => handleOpenChange(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
