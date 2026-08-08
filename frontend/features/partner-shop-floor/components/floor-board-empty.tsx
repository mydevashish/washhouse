'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { FloorEmptyPicture } from '@/features/partner-shop-floor/components/floor-photo-stack';
import { cn } from '@/lib/utils';

type FloorBoardEmptyProps = {
  title: string;
  instruction: string;
  imageSrc?: string;
  imageAlt?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  testId?: string;
};

/** Picture + one Hinglish instruction (literacy-tolerant empty). */
export function FloorBoardEmpty({
  title,
  instruction,
  imageSrc = '/catalog/heroes/fresh-laundry.webp',
  imageAlt = 'Fresh folded laundry bags',
  actionHref = '/partner/floor/new',
  actionLabel = 'Naya Order banao',
  className,
  testId = 'floor-board-empty',
}: FloorBoardEmptyProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border px-4 py-8 text-center',
        className,
      )}
      role="status"
      data-testid={testId}
    >
      <FloorEmptyPicture src={imageSrc} alt={imageAlt} />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-base text-muted-foreground">{instruction}</p>
      {actionHref && actionLabel ? (
        <Button asChild size="lg" className="mt-5 min-h-14 px-6 text-base">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
