'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Sticky mobile CTA — keeps primary action visible while scrolling discover. */
export function MobileCtaBar() {
  const pathname = usePathname();
  if (pathname !== '/discover') return null;

  return (
    <div
      className="bottom-above-nav fixed left-0 right-0 z-30 border-t border-border bg-bg-0/95 p-3 backdrop-blur sm:hidden"
      role="region"
      aria-label="Quick action"
    >
      <Button asChild size="lg" className="w-full rounded-xl">
        <Link href="#partners">
          Book pickup
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
