'use client';

import Link from 'next/link';
import { ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  OrderSummarySidebar,
  SignInPrompt,
} from '@/features/discover/detail/order-summary-sidebar';
import { computeOrderQuote, formatInr } from '@/features/discover/detail/order-pricing';
import type { LaundryServiceItem } from '@/services/laundries';

type OrderSummaryMobileProps = {
  services: LaundryServiceItem[];
  quantities: Record<string, number>;
  accessToken: string | null;
  onContinue: () => void;
  continueLabel?: string;
  isLoading?: boolean;
  checkoutDisabled?: boolean;
  checkoutDisabledLabel?: string;
};

export function OrderSummaryMobile({
  services,
  quantities,
  accessToken,
  onContinue,
  continueLabel = 'Continue',
  isLoading = false,
  checkoutDisabled = false,
  checkoutDisabledLabel = 'Coming soon',
}: OrderSummaryMobileProps) {
  const quote = computeOrderQuote(services, quantities);
  if (quote.lines.length === 0) return null;

  return (
    <div className="bottom-above-nav fixed left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3 p-3">
        <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex min-h-[44px] flex-1 flex-col items-start rounded-xl border border-border bg-muted/50 px-4 py-2 text-left transition-colors hover:bg-muted"
              aria-label="View order summary"
            >
              <span className="text-xs text-muted-foreground">
                {quote.itemCount} {quote.itemCount === 1 ? 'service' : 'services'}
              </span>
              <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-foreground">
                {formatInr(quote.total)}
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Order summary</DrawerTitle>
              <DrawerDescription>Review pricing before you book</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <OrderSummarySidebar
                services={services}
                quantities={quantities}
                compact
              >
                {!accessToken && <SignInPrompt />}
              </OrderSummarySidebar>
            </div>
          </DrawerContent>
        </Drawer>

        {!accessToken ? (
          checkoutDisabled ? (
            <Button type="button" size="lg" className="shrink-0" disabled>
              {checkoutDisabledLabel}
            </Button>
          ) : (
            <Button asChild size="lg" className="shrink-0">
              <Link href="/login">Sign in</Link>
            </Button>
          )
        ) : (
          <Button
            type="button"
            size="lg"
            className="shrink-0"
            disabled={isLoading || checkoutDisabled}
            onClick={onContinue}
          >
            {checkoutDisabled ? checkoutDisabledLabel : isLoading ? '…' : continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
