import Image from 'next/image';

import { WASHHOUSE_DECORATIVE_BANNERS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { cn } from '@/lib/utils';

const HERO_BANNER = WASHHOUSE_DECORATIVE_BANNERS.pageHeroStoreInterior;

export function StoresHero() {
  return (
    <header className="relative isolate overflow-hidden border-b border-border">
      <Image
        src={HERO_BANNER.photo.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div className={cn('absolute inset-0', HERO_BANNER.overlayClassName)} aria-hidden />

      {/* Phone: short brand-led band so search / Near me reach faster; roomier from sm up */}
      <div className="relative mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
          Our stores
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground text-balance sm:mt-3 sm:text-4xl lg:text-5xl">
          Find a WashHouse store near you
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base lg:text-lg">
          Browse verified partners in your neighbourhood. Same services and pricing across stores —
          call, message, or get directions when you&apos;re ready.
        </p>
      </div>
    </header>
  );
}
