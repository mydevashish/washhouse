import Image from 'next/image';

import { WASHHOUSE_DECORATIVE_BANNERS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { cn } from '@/lib/utils';

const HERO_BANNER = WASHHOUSE_DECORATIVE_BANNERS.pageHeroFreshLaundry;

export function ServicesHero() {
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

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">Services</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
          Professional care for every fabric
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
          From everyday wash &amp; fold to express dry cleaning — here&apos;s what you can book through
          The WashHouse. Services and starting rates are shared across stores; pick a location near
          you and schedule pickup.
        </p>
      </div>
    </header>
  );
}
