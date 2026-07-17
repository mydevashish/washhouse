'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BOOK_NOW_QUERY_PARAM,
  BOOK_NOW_QUERY_VALUE,
} from '@/features/marketing/book-now/book-now-constants';
import { BookPickupForm } from '@/features/marketing/book-now/book-pickup-form';
import { useBookNowStore } from '@/features/marketing/book-now/book-now-store';
import { cn } from '@/lib/utils';

function readBookQuery(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get(BOOK_NOW_QUERY_PARAM) ===
    BOOK_NOW_QUERY_VALUE
  );
}

function stripBookQuery(pathname: string): string {
  const next = new URLSearchParams(window.location.search);
  next.delete(BOOK_NOW_QUERY_PARAM);
  const q = next.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/**
 * Marketing Book Now dialog — Radix Dialog (focus trap, Esc, aria-labelledby).
 * Full-screen on small viewports; centered modal from `sm` up.
 * Deep link: any marketing route with `?book=1` opens this dialog.
 */
export function BookNowDialog() {
  const isOpen = useBookNowStore((s) => s.isOpen);
  const defaultService = useBookNowStore((s) => s.defaultService);
  const setOpen = useBookNowStore((s) => s.setOpen);
  const close = useBookNowStore((s) => s.close);

  const pathname = usePathname();
  const router = useRouter();

  // Open from `?book=1` without useSearchParams (avoids Suspense delay on first paint)
  useLayoutEffect(() => {
    if (readBookQuery()) {
      setOpen(true);
    }

    const onPopState = () => {
      if (readBookQuery()) {
        setOpen(true);
      } else {
        close();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setOpen, close, pathname]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setOpen(true);
      return;
    }
    close();
    if (readBookQuery()) {
      router.replace(stripBookQuery(pathname), { scroll: false });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="book-now-dialog"
        className={cn(
          'gap-4 overflow-y-auto',
          // Mobile: edge-to-edge sheet-like surface
          'max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:flex max-sm:h-[100dvh] max-sm:max-h-[100dvh]',
          'max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0',
          'max-sm:rounded-none max-sm:border-0 max-sm:p-4 max-sm:pt-12',
          // Desktop / tablet: centered modal
          'sm:max-h-[min(90vh,100%)] sm:max-w-md',
        )}
      >
        <DialogHeader>
          <DialogTitle>Schedule a pickup</DialogTitle>
          <DialogDescription>
            Leave your details and we&apos;ll call or WhatsApp you to confirm a free pickup. No
            account needed.
          </DialogDescription>
        </DialogHeader>

        <BookPickupForm
          key={defaultService ?? 'default'}
          defaultService={defaultService}
          onSuccess={() => handleOpenChange(false)}
          idPrefix="book-now"
        />
      </DialogContent>
    </Dialog>
  );
}
