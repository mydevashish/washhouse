'use client';

import { useEffect, useState } from 'react';
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

const BOTTOM_CTA_SELECTOR = '[data-marketing-bottom-cta], [data-marketing-sticky-cta]';

function useBottomCtaOverlap() {
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll(BOTTOM_CTA_SELECTOR));
    if (targets.length === 0) return;

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          setObscured(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05));
        },
        { threshold: [0, 0.05, 0.15], rootMargin: '0px 0px -80px 0px' },
      );
      targets.forEach((target) => observer!.observe(target));
    } catch {
      return;
    }

    return () => observer?.disconnect();
  }, []);

  return obscured;
}

type ContactActionButtonProps = {
  href: string;
  label: string;
  external?: boolean;
  size: 'fab' | 'inline';
  children: React.ReactNode;
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
  const obscured = useBottomCtaOverlap();

  return (
    <div
      role="group"
      aria-label="Quick contact"
      aria-hidden={obscured}
      {...(obscured ? { inert: true } : {})}
      className={cn(
        'fixed right-4 z-40 flex flex-col gap-3 lg:hidden',
        'bottom-[max(1.25rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))]',
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
