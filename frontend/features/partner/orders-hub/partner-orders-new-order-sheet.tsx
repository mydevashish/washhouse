'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

type PartnerOrdersNewOrderSheetProps = {
  /** Compact header control vs floating mobile FAB. */
  variant?: 'header' | 'fab';
  className?: string;
};

/** Primary intake — opens Create order tab on the hub (no extra choice dialog). */
export function PartnerOrdersNewOrderSheet({
  variant = 'header',
  className,
}: PartnerOrdersNewOrderSheetProps) {
  const href = buildOrdersHubPath('/partner/orders', 'create');

  if (variant === 'fab') {
    return (
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
        asChild
      >
        <Link href={href}>
          <Plus className="h-5 w-5" aria-hidden />
          New order
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={cn('h-9 gap-1.5 px-2.5', className)}
      data-testid="partner-orders-new-order-header"
      asChild
    >
      <Link href={href}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
        New order
      </Link>
    </Button>
  );
}
