'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Store, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

const CHOICES = [
  {
    id: 'walk_in',
    href: '/partner/new-order?mode=walk_in',
    label: 'Walk-in',
    description: 'Counter intake with Cloth Wall — print tags after save.',
    icon: Store,
    image: '/catalog/heroes/store-interior.webp',
    testId: 'partner-intake-choice-walk-in',
  },
  {
    id: 'doorstep',
    href: '/partner/new-order?mode=assisted',
    label: 'Doorstep',
    description: 'Assisted pickup and delivery for a known phone.',
    icon: Truck,
    image: '/catalog/heroes/fresh-laundry.webp',
    testId: 'partner-intake-choice-doorstep',
  },
  {
    id: 'desk',
    href: buildOrdersHubPath('/partner/orders', 'desk'),
    label: 'Find customer',
    description: 'Look up by phone, then start an order from history.',
    icon: UserRound,
    image: '/catalog/heroes/fresh-laundry.webp',
    testId: 'partner-intake-choice-desk',
  },
] as const;

type PartnerOrdersNewOrderSheetProps = {
  /** Compact header control vs floating mobile FAB. */
  variant?: 'header' | 'fab';
  className?: string;
};

/**
 * Hub intake entry — picture-led Walk-in / Doorstep / Find customer.
 * Reuses Cloth Wall + assisted New Order gate; does not invent a third form.
 */
export function PartnerOrdersNewOrderSheet({
  variant = 'header',
  className,
}: PartnerOrdersNewOrderSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'fab' ? (
          <Button
            type="button"
            size="lg"
            className={cn(
              'fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40',
              'h-12 gap-1.5 rounded-full px-4 shadow-md sm:bottom-6',
              'md:hidden',
              className,
            )}
            aria-label="New order"
            data-testid="partner-orders-new-order-fab"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New order
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className={cn('h-9 gap-1.5 px-3', className)}
            data-testid="partner-orders-new-order-header"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          'gap-0 overflow-hidden p-0 sm:max-w-md',
          'left-0 right-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl',
          'bottom-0 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl',
        )}
        data-testid="partner-orders-new-order-sheet"
      >
        <DialogHeader className="space-y-1 border-b border-border/60 px-4 pb-3 pt-4 sm:px-5">
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>
            Choose walk-in at the counter, doorstep assisted, or find a customer first.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 p-4 sm:p-5" role="list">
          {CHOICES.map((choice, index) => {
            const Icon = choice.icon;
            return (
              <li key={choice.id}>
                <Link
                  href={choice.href}
                  data-testid={choice.testId}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex min-h-[3.75rem] items-center gap-3 rounded-xl border border-border/70 bg-card p-2.5',
                    'transition-[colors,transform] duration-200 hover:bg-muted/50 active:scale-[0.99]',
                    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60">
                    <Image
                      src={choice.image}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      {choice.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {choice.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
