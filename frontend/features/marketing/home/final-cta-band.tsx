'use client';

import Image from 'next/image';
import { MessageCircle, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { GlassSurface } from '@/components/ui/glass-surface';
import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { WASHHOUSE_DECORATIVE_BANNERS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import {
  GLASS_ON_DARK_GRADIENT,
  MARKETING_CONTAINER,
  MARKETING_SECTION_PY,
} from '@/features/marketing/shared/marketing-layout';
import { cn } from '@/lib/utils';

/** Store lounge/counter hero — decorative background behind CTA copy */
const CTA_BACKGROUND = WASHHOUSE_DECORATIVE_BANNERS.brandCta;

const WHATSAPP_MESSAGE = 'Hi WashHouse — I would like to book a laundry pickup.';

export function FinalCtaBand() {
  const reduce = useReducedMotion();
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);

  return (
    <section
      aria-labelledby="final-cta-title"
      data-marketing-bottom-cta
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
        <FadeIn>
          <FadeInItem>
            <motion.div
              className="mx-auto max-w-3xl"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
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
                  Chat on WhatsApp or call us — we&apos;ll help you book pickup, answer questions,
                  and get your clothes back fresh.
                </p>

                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full px-6',
                      'bg-success text-sm font-semibold text-success-foreground shadow-soft',
                      'transition-[transform,opacity] duration-base ease-out',
                      'hover:bg-success/90 active:scale-[0.98]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'sm:w-auto sm:min-w-[12rem]',
                    )}
                  >
                    <MessageCircle className="h-5 w-5 text-success-foreground" aria-hidden />
                    WhatsApp
                  </a>
                  <a
                    href={telHref}
                    className={cn(
                      'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full px-6',
                      'border-2 border-on-hero/70 bg-white/10 text-sm font-semibold text-on-hero max-md:[backdrop-filter:none]',
                      'md:backdrop-blur-sm',
                      'transition-[transform,opacity,background-color] duration-base ease-out',
                      'hover:bg-white/15 active:scale-[0.98]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'sm:w-auto sm:min-w-[12rem]',
                    )}
                  >
                    <Phone className="h-5 w-5" aria-hidden />
                    Call {CONTACT_CONFIG.phone}
                  </a>
                </div>
              </GlassSurface>
            </motion.div>
          </FadeInItem>
        </FadeIn>
      </div>
    </section>
  );
}
