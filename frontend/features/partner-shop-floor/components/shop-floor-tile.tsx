'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const TILE_TONES = {
  order: 'border-[color:var(--floor-tile-order-border)] bg-[color:var(--floor-tile-order-bg)] text-[color:var(--floor-tile-order-fg)]',
  today: 'border-[color:var(--floor-tile-today-border)] bg-[color:var(--floor-tile-today-bg)] text-[color:var(--floor-tile-today-fg)]',
  ready: 'border-[color:var(--floor-tile-ready-border)] bg-[color:var(--floor-tile-ready-bg)] text-[color:var(--floor-tile-ready-fg)]',
  print: 'border-[color:var(--floor-tile-print-border)] bg-[color:var(--floor-tile-print-bg)] text-[color:var(--floor-tile-print-fg)]',
} as const;

export type ShopFloorTileTone = keyof typeof TILE_TONES;

type ShopFloorTileProps = {
  href: string;
  label: string;
  english: string;
  icon: LucideIcon;
  tone: ShopFloorTileTone;
  /** Needs-attention count (Received+Washing / Ready). Hidden when 0. */
  badgeCount?: number;
};

export function ShopFloorTile({
  href,
  label,
  english,
  icon: Icon,
  tone,
  badgeCount = 0,
}: ShopFloorTileProps) {
  const showBadge = badgeCount > 0;
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 text-center',
        'shadow-soft outline-none transition-[transform,box-shadow,background-color] duration-base',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'motion-safe:active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-pop',
        TILE_TONES[tone],
      )}
      aria-label={
        showBadge
          ? `${label} — ${english}, ${badgeCount} needs attention`
          : `${label} — ${english}`
      }
    >
      {showBadge ? (
        <span
          className="absolute right-3 top-3 flex min-h-8 min-w-8 items-center justify-center rounded-full bg-danger px-2 text-sm font-bold text-danger-foreground shadow-soft"
          data-testid="shop-floor-tile-badge"
          aria-hidden
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/70 shadow-soft sm:h-20 sm:w-20"
        aria-hidden
      >
        <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={2} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{label}</span>
        <span className="text-sm font-medium opacity-80">{english}</span>
      </span>
    </Link>
  );
}
