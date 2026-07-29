'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
import { MARKETING_STORES_HREF } from '@/lib/navigation/marketing-nav';
import { cn } from '@/lib/utils';

type FloatingContactActionsProps = {
  /** Fixed stack on mobile/tablet; compact row in the footer on desktop. */
  variant?: 'fab' | 'inline';
  className?: string;
};

const WHATSAPP_MESSAGE = 'Hi WashHouse — I have a question.';

/** Hide FABs when these regions would sit under the floating stack. */
const BOTTOM_CTA_SELECTOR = '[data-marketing-bottom-cta]';
const FOOTER_SOCIAL_SELECTOR = '[data-marketing-footer-social]';
/** Mobile sticky bar already exposes WhatsApp + Call — keep Find stores only. */
const STICKY_BAR_SELECTOR = '[data-marketing-sticky-cta].fixed';

type FabOverlapState = {
  /** Fully hide stack (final CTA / footer social). */
  obscured: boolean;
  /** Sticky CTA visible — drop redundant Call + WhatsApp. */
  contactRedundant: boolean;
};

function useFabOverlap(): FabOverlapState {
  const [obscured, setObscured] = useState(false);
  const [contactRedundant, setContactRedundant] = useState(false);

  useEffect(() => {
    const bottomCtas = Array.from(document.querySelectorAll(BOTTOM_CTA_SELECTOR));
    const footerSocial = Array.from(document.querySelectorAll(FOOTER_SOCIAL_SELECTOR));
    const stickyBars = Array.from(document.querySelectorAll(STICKY_BAR_SELECTOR));
    if (bottomCtas.length === 0 && footerSocial.length === 0 && stickyBars.length === 0) {
      return;
    }

    const fullHide = new Set<Element>();
    const stickyVisible = new Set<Element>();

    const sync = () => {
      setObscured(fullHide.size > 0);
      setContactRedundant(stickyVisible.size > 0);
    };

    const onFullHide = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
          fullHide.add(entry.target);
        } else {
          fullHide.delete(entry.target);
        }
      });
      sync();
    };

    const onSticky = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const hidden =
          el.getAttribute('aria-hidden') === 'true' ||
          el.hasAttribute('inert');
        if (entry.isIntersecting && entry.intersectionRatio > 0.05 && !hidden) {
          stickyVisible.add(el);
        } else {
          stickyVisible.delete(el);
        }
      });
      sync();
    };

    let ctaObserver: IntersectionObserver | undefined;
    let footerObserver: IntersectionObserver | undefined;
    let stickyObserver: IntersectionObserver | undefined;

    try {
      if (bottomCtas.length > 0) {
        ctaObserver = new IntersectionObserver(onFullHide, {
          threshold: [0, 0.05, 0.15],
          rootMargin: '0px 0px -80px 0px',
        });
        bottomCtas.forEach((target) => ctaObserver!.observe(target));
      }

      if (footerSocial.length > 0) {
        footerObserver = new IntersectionObserver(onFullHide, {
          threshold: [0, 0.05, 0.15],
          rootMargin: '0px 0px 140px 0px',
        });
        footerSocial.forEach((target) => footerObserver!.observe(target));
      }

      if (stickyBars.length > 0) {
        stickyObserver = new IntersectionObserver(onSticky, {
          threshold: [0, 0.05, 0.5, 1],
        });
        stickyBars.forEach((target) => stickyObserver!.observe(target));
      }
    } catch {
      return;
    }

    return () => {
      ctaObserver?.disconnect();
      footerObserver?.disconnect();
      stickyObserver?.disconnect();
    };
  }, []);

  return { obscured, contactRedundant };
}

type ContactActionButtonProps = {
  href: string;
  label: string;
  external?: boolean;
  size: 'fab' | 'inline';
  children: ReactNode;
  className?: string;
};

function ContactActionButton({
  href,
  label,
  external,
  size,
  children,
  className,
}: ContactActionButtonProps) {
  const sizeClass =
    size === 'fab'
      ? 'h-12 w-12 min-h-12 min-w-12'
      : 'h-11 w-11 min-h-11 min-w-11';

  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-border/70 bg-card shadow-soft',
        'transition-[transform,opacity] duration-base ease-out',
        'hover:scale-[1.04] hover:bg-card/95 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        sizeClass,
        className,
      )}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

function ContactActionButtons({
  size,
  hideContactChannels = false,
}: {
  size: 'fab' | 'inline';
  /** When sticky CTA already shows WhatsApp + Call. */
  hideContactChannels?: boolean;
}) {
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);

  return (
    <>
      {!hideContactChannels ? (
        <ContactActionButton
          href={whatsappHref}
          label="Chat on WhatsApp"
          external
          size={size}
          className={size === 'fab' ? 'order-3' : undefined}
        >
          <MessageCircle
            className={cn(size === 'fab' ? 'h-5 w-5' : 'h-4 w-4', 'text-[#25D366]')}
            aria-hidden
          />
        </ContactActionButton>
      ) : null}
      <ContactActionButton
        href={MARKETING_STORES_HREF}
        label="Find stores"
        size={size}
        className={size === 'fab' ? 'order-2' : undefined}
      >
        <MapPin
          className={cn(size === 'fab' ? 'h-5 w-5' : 'h-4 w-4', 'text-primary')}
          aria-hidden
        />
      </ContactActionButton>
      {!hideContactChannels ? (
        <ContactActionButton
          href={telHref}
          label={`Call ${CONTACT_CONFIG.phone}`}
          size={size}
          className={size === 'fab' ? 'order-1' : undefined}
        >
          <Phone
            className={cn(size === 'fab' ? 'h-5 w-5' : 'h-4 w-4', 'text-primary')}
            aria-hidden
          />
        </ContactActionButton>
      ) : null}
    </>
  );
}

function FloatingContactActionsInline({ className }: { className?: string }) {
  return (
    <div
      className={cn('hidden items-center justify-end gap-2 lg:flex', className)}
      role="group"
      aria-label="Quick contact"
    >
      <ContactActionButtons size="inline" />
    </div>
  );
}

function FloatingContactActionsFab({ className }: { className?: string }) {
  const { obscured, contactRedundant } = useFabOverlap();

  return (
    <div
      role="group"
      aria-label="Quick contact"
      aria-hidden={obscured}
      {...(obscured ? { inert: true } : {})}
      className={cn(
        'fixed right-4 z-40 flex flex-col gap-3 lg:hidden',
        'bottom-[max(5.25rem,calc(4.75rem+env(safe-area-inset-bottom,0px)))]',
        'transition-[transform,opacity] duration-base ease-out',
        obscured && 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
    >
      <ContactActionButtons size="fab" hideContactChannels={contactRedundant} />
    </div>
  );
}

export function FloatingContactActions({
  variant = 'fab',
  className,
}: FloatingContactActionsProps) {
  if (variant === 'inline') {
    return <FloatingContactActionsInline className={className} />;
  }

  return <FloatingContactActionsFab className={className} />;
}
