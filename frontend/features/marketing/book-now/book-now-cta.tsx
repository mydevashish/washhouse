'use client';

import type { VariantProps } from 'class-variance-authority';
import type { MouseEvent, ReactNode } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  buildBookNowHref,
  type BookNowServiceId,
} from '@/features/marketing/book-now/book-now-constants';
import { useBookNowStore } from '@/features/marketing/book-now/book-now-store';
import { cn } from '@/lib/utils';

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type BookNowCtaProps = {
  children?: ReactNode;
  className?: string;
  variant?: ButtonVariantProps['variant'];
  size?: ButtonVariantProps['size'];
  /** Pre-select a service when opened from a service card. */
  service?: BookNowServiceId;
  /** Extra click handler (e.g. close mobile nav). */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Primary marketing Book Now control — opens the shared BookNowDialog.
 * Uses a button (not navigation) so focus returns to the CTA on close.
 */
export function BookNowCta({
  children = 'Book Now',
  className,
  variant = 'default',
  size = 'default',
  service,
  onClick,
}: BookNowCtaProps) {
  const open = useBookNowStore((s) => s.open);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={(event) => {
        open(service ? { service } : undefined);
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}

type BookNowLinkProps = {
  children?: ReactNode;
  className?: string;
  service?: BookNowServiceId;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Link-styled Book Now control with `?book=1` href for progressive enhancement /
 * copy-link. Click opens the dialog without a full navigation.
 */
export function BookNowLink({
  children = 'Book Now',
  className,
  service,
  onClick,
}: BookNowLinkProps) {
  const open = useBookNowStore((s) => s.open);
  const href = buildBookNowHref('/');

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        open(service ? { service } : undefined);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
