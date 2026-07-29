'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import { useMarketingBookingCtaMode } from '@/features/marketing/lib/use-marketing-booking-cta-mode';
import { useFinalCtaVisible } from '@/components/marketing/use-final-cta-visible';
import {
  MARKETING_BOOK_NEAREST_HREF,
  MARKETING_BOOK_NEAREST_LABEL,
} from '@/lib/navigation/marketing-nav';
import { cn } from '@/lib/utils';

const WHATSAPP_MESSAGE = 'Hi WashHouse — I would like to book a laundry pickup.';

const stickyActionClass =
  'inline-flex h-12 min-h-12 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold ' +
  'transition-[transform,opacity,background-color] duration-base ease-out active:scale-[0.98] ' +
  'motion-reduce:transition-none motion-reduce:active:scale-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Deferred until first open — avoids loading Drawer + list hooks on every marketing page. */
const StoresQuickPickSheet = dynamic(
  () =>
    import('@/features/marketing/stores/stores-quick-pick-sheet').then(
      (m) => m.StoresQuickPickSheet,
    ),
  { ssr: false },
);

export function MobileStickyCta() {
  const finalCtaVisible = useFinalCtaVisible();
  const { onlineBooking } = useMarketingBookingCtaMode();
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);

  const openQuickPick = () => {
    setSheetMounted(true);
    setSheetOpen(true);
  };

  return (
    <>
      <div
        data-marketing-sticky-cta
        data-booking-mode={onlineBooking ? 'online' : 'offline'}
        aria-hidden={finalCtaVisible}
        {...(finalCtaVisible ? { inert: true } : {})}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 p-3 backdrop-blur-md lg:hidden',
          'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
          'transition-[transform,opacity] duration-base ease-out motion-reduce:transition-none',
          finalCtaVisible && 'pointer-events-none translate-y-full opacity-0',
        )}
      >
        <div className="mx-auto flex max-w-[1440px] items-stretch gap-2">
          {onlineBooking ? (
            <>
              <Link
                href={MARKETING_BOOK_NEAREST_HREF}
                className={cn(
                  stickyActionClass,
                  'flex-1 gap-2 px-4 shadow-soft',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                )}
              >
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{MARKETING_BOOK_NEAREST_LABEL}</span>
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className={cn(
                  stickyActionClass,
                  'shrink-0 border-2 border-success/60 bg-background text-success',
                  'hover:bg-success/10',
                )}
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              </a>
              <a
                href={telHref}
                aria-label="Call now"
                className={cn(
                  stickyActionClass,
                  'shrink-0 border-2 border-border/80 bg-background text-foreground',
                  'hover:bg-muted/60',
                )}
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            </>
          ) : (
            <>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  stickyActionClass,
                  'flex-1 gap-2 px-4 shadow-soft',
                  'bg-success text-success-foreground',
                  'hover:bg-success/90',
                )}
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">Book on WhatsApp</span>
              </a>
              <button
                type="button"
                aria-label="Find stores"
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                onClick={openQuickPick}
                className={cn(
                  stickyActionClass,
                  'shrink-0 border-2 border-border/80 bg-background text-foreground',
                  'hover:bg-muted/60',
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Stores
              </button>
              <a
                href={telHref}
                className={cn(
                  stickyActionClass,
                  'shrink-0 gap-2 border-2 border-success/60 bg-background text-success',
                  'hover:bg-success/10',
                )}
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                Call Now
              </a>
            </>
          )}
        </div>
      </div>

      {!onlineBooking && sheetMounted && (
        <StoresQuickPickSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      )}
    </>
  );
}
