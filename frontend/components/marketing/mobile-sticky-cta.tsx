'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';

import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import { cn } from '@/lib/utils';

const WHATSAPP_MESSAGE = 'Hi WashHouse — I would like to book a laundry pickup.';
const BOTTOM_CTA_SELECTOR = '[data-marketing-bottom-cta]';

function useFinalCtaVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll(BOTTOM_CTA_SELECTOR));
    if (targets.length === 0) return;

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          setVisible(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05));
        },
        { threshold: [0, 0.05, 0.15], rootMargin: '0px 0px -80px 0px' },
      );
      targets.forEach((target) => observer!.observe(target));
    } catch {
      return;
    }

    return () => observer?.disconnect();
  }, []);

  return visible;
}

export function MobileStickyCta() {
  const finalCtaVisible = useFinalCtaVisible();
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);

  return (
    <div
      data-marketing-sticky-cta
      aria-hidden={finalCtaVisible}
      {...(finalCtaVisible ? { inert: true } : {})}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 p-3 backdrop-blur-md lg:hidden',
        'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
        'transition-[transform,opacity] duration-base ease-out',
        finalCtaVisible && 'pointer-events-none translate-y-full opacity-0',
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-stretch gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex h-12 min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4',
            'bg-success text-sm font-semibold text-success-foreground shadow-soft',
            'transition-[transform,opacity] duration-base ease-out',
            'hover:bg-success/90 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          Book on WhatsApp
        </a>
        <a
          href={telHref}
          className={cn(
            'inline-flex h-12 min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-success/60 px-4',
            'bg-background text-sm font-semibold text-success',
            'transition-[transform,opacity,background-color] duration-base ease-out',
            'hover:bg-success/10 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          Call Now
        </a>
      </div>
    </div>
  );
}
