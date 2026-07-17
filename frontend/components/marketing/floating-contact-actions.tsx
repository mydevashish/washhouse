'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MessageCircle, Phone } from 'lucide-react';

import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';
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

function useFabOverlap() {
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    const bottomCtas = Array.from(document.querySelectorAll(BOTTOM_CTA_SELECTOR));
    const footerSocial = Array.from(document.querySelectorAll(FOOTER_SOCIAL_SELECTOR));
    if (bottomCtas.length === 0 && footerSocial.length === 0) return;

    const visible = new Set<Element>();
    const sync = () => setObscured(visible.size > 0);

    const onEntries = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });
      sync();
    };

    let ctaObserver: IntersectionObserver | undefined;
    let footerObserver: IntersectionObserver | undefined;

    try {
      if (bottomCtas.length > 0) {
        ctaObserver = new IntersectionObserver(onEntries, {
          threshold: [0, 0.05, 0.15],
          rootMargin: '0px 0px -80px 0px',
        });
        bottomCtas.forEach((target) => ctaObserver!.observe(target));
      }

      if (footerSocial.length > 0) {
        // Expand downward so FABs yield as social enters the sticky/FAB zone
        footerObserver = new IntersectionObserver(onEntries, {
          threshold: [0, 0.05, 0.15],
          rootMargin: '0px 0px 140px 0px',
        });
        footerSocial.forEach((target) => footerObserver!.observe(target));
      }
    } catch {
      return;
    }

    return () => {
      ctaObserver?.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  return obscured;
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

function ContactActionButtons({ size }: { size: 'fab' | 'inline' }) {
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(CONTACT_CONFIG.whatsapp, WHATSAPP_MESSAGE);

  return (
    <>
      <ContactActionButton
        href={whatsappHref}
        label="Chat on WhatsApp"
        external
        size={size}
        className={size === 'fab' ? 'order-2' : undefined}
      >
        <MessageCircle
          className={cn(size === 'fab' ? 'h-5 w-5' : 'h-4 w-4', 'text-[#25D366]')}
          aria-hidden
        />
      </ContactActionButton>
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
  const obscured = useFabOverlap();

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
      <ContactActionButtons size="fab" />
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
