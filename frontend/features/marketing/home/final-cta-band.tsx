'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

import { GlassSurface } from '@/components/ui/glass-surface';
import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import { FadeIn } from '@/features/discover/marketplace/fade-in';
import { WASHHOUSE_DECORATIVE_BANNERS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { useMarketingBookingCtaMode } from '@/features/marketing/lib/use-marketing-booking-cta-mode';
import {
  GLASS_ON_DARK_GRADIENT,
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import {
  MARKETING_BOOK_NEAREST_HREF,
  MARKETING_BOOK_NEAREST_LABEL,
  MARKETING_STORES_HREF,
} from '@/lib/navigation/marketing-nav';
import { cn } from '@/lib/utils';

/** Store lounge/counter hero — decorative background behind CTA copy */
const CTA_BACKGROUND = WASHHOUSE_DECORATIVE_BANNERS.brandCta;

const WHATSAPP_MESSAGE = 'Hi WashHouse — I would like to book a laundry pickup.';

const primaryCtaClass =
  'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 ' +
  'text-sm font-semibold shadow-soft ' +
  'transition-[transform,opacity] duration-base ease-out ' +
  'active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'sm:w-auto sm:min-w-[12rem]';

const secondaryOnDarkClass =
  'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 ' +
  'border-2 border-on-hero/70 bg-white/10 text-sm font-semibold text-on-hero max-md:[backdrop-filter:none] ' +
  'md:backdrop-blur-sm ' +
  'transition-[transform,opacity,background-color] duration-base ease-out ' +
  'hover:bg-white/15 active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'sm:w-auto sm:min-w-[12rem]';

export function FinalCtaBand() {
  const { onlineBooking } = useMarketingBookingCtaMode();
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);

  return (
    <section
      aria-labelledby="final-cta-title"
      data-marketing-bottom-cta
      data-booking-mode={onlineBooking ? 'online' : 'offline'}
      className={cn('relative isolate overflow-hidden', MARKETING_SECTION_PY)}
    >
      <Image
        src={CTA_BACKGROUND.photo.src}
        alt=""
        fill
        priority={false}
        sizes="(max-width: 1440px) 100vw, 1440px"
        className="object-cover"
        aria-hidden
      />
      <div className={cn('absolute inset-0', CTA_BACKGROUND.overlayClassName)} aria-hidden />

      <div className={cn('relative', MARKETING_CONTAINER)}>
        {/* No FadeInItem / nested opacity:0 — booking CTAs must stay visible (WCAG 2.4.7). */}
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <GlassSurface
              variant="onDark"
              className={cn(
                'rounded-2xl px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-12 lg:py-12',
                GLASS_ON_DARK_GRADIENT,
              )}
            >
              <h2
                id="final-cta-title"
                className="text-2xl font-bold tracking-tight text-on-hero sm:text-3xl lg:text-4xl"
              >
                Ready to Experience Premium Laundry?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-on-hero-muted sm:text-lg">
                {onlineBooking
                  ? 'Book the nearest laundry online — or WhatsApp and call us if you need a hand.'
                  : 'Browse stores near you, chat on WhatsApp, or call us — book pickup, get answers, and get your clothes back fresh.'}
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                {onlineBooking ? (
                  <>
                    <Link
                      href={MARKETING_BOOK_NEAREST_HREF}
                      className={cn(
                        primaryCtaClass,
                        'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      <MapPin className="h-5 w-5" aria-hidden />
                      {MARKETING_BOOK_NEAREST_LABEL}
                    </Link>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={secondaryOnDarkClass}
                    >
                      <MessageCircle className="h-5 w-5" aria-hidden />
                      WhatsApp
                    </a>
                    <a href={telHref} className={secondaryOnDarkClass}>
                      <Phone className="h-5 w-5" aria-hidden />
                      Call {CONTACT_CONFIG.phone}
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        primaryCtaClass,
                        'bg-success text-success-foreground hover:bg-success/90',
                      )}
                    >
                      <MessageCircle className="h-5 w-5 text-success-foreground" aria-hidden />
                      WhatsApp
                    </a>
                    <Link href={MARKETING_STORES_HREF} className={secondaryOnDarkClass}>
                      <MapPin className="h-5 w-5" aria-hidden />
                      Find stores
                    </Link>
                    <a href={telHref} className={secondaryOnDarkClass}>
                      <Phone className="h-5 w-5" aria-hidden />
                      Call {CONTACT_CONFIG.phone}
                    </a>
                  </>
                )}
              </div>
            </GlassSurface>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
