import Image from 'next/image';
import Link from 'next/link';

import { MarketingSection } from '@/features/marketing/shared/marketing-section';
import {
  SPECIAL_CARE_ITEMS,
  type SpecialCareItem,
} from '@/features/marketing/home/special-care-items';
import { cn } from '@/lib/utils';

function SpecialCareTile({ item }: { item: SpecialCareItem }) {
  const { slug, label, image, imageAlt } = item;

  return (
    <li className="flex justify-center">
      <Link
        href={`/services#${slug}`}
        className="group flex w-full max-w-[7.5rem] flex-col items-center gap-2 sm:max-w-[8.5rem] md:max-w-none"
      >
        <div
          className={cn(
            'glass-surface glass-surface--subtle relative rounded-full p-[3px] shadow-soft',
            'size-[4.25rem] sm:size-20 md:size-24 lg:size-28',
            'transition-transform duration-base ease-out md:group-hover:scale-105',
          )}
        >
          <div className="relative size-full overflow-hidden rounded-full">
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 68px, (max-width: 1024px) 96px, 112px"
            />
          </div>
        </div>

        <span className="text-center text-[0.6875rem] font-semibold leading-tight text-foreground sm:text-xs md:text-sm">
          {label}
        </span>
      </Link>
    </li>
  );
}

export function SpecialCareSection() {
  return (
    <MarketingSection
      aria-labelledby="special-care-title"
      alternate
      header={{
        title: 'Special Care For Delicate Items',
        description: 'Expert handling for garments and home textiles that need extra attention.',
        align: 'center',
      }}
    >
      <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:gap-x-6 md:gap-y-10 lg:gap-x-8">
        {SPECIAL_CARE_ITEMS.map((item) => (
          <SpecialCareTile key={item.id} item={item} />
        ))}
      </ul>
    </MarketingSection>
  );
}
