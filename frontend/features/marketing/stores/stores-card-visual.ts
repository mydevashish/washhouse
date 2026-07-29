/**
 * Stable per-slug visual accents for marketing store cards.
 * Keeps tokens consistent while avoiding identical gradient overlays across the gallery.
 */

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % 997;
  return hash;
}

/** Cover scrim variants — brand / sky / ink tones only (no purple). */
const COVER_OVERLAYS = [
  'bg-gradient-to-t from-black/80 via-black/30 to-transparent',
  'bg-gradient-to-t from-black/75 via-brand-950/35 to-transparent',
  'bg-gradient-to-t from-black/80 via-sky-950/25 to-transparent',
  'bg-gradient-to-tl from-black/80 via-black/20 to-brand-900/20',
  'bg-gradient-to-tr from-black/75 via-transparent to-black/10',
] as const;

/** Solid muted fallbacks while the cover image paints (no layout shift). */
const COVER_FALLBACKS = [
  'bg-muted',
  'bg-brand-50 dark:bg-brand-950/50',
  'bg-sky-50 dark:bg-sky-950/40',
  'bg-muted/80',
] as const;

export function getStoreCardOverlayClass(slug: string): string {
  return COVER_OVERLAYS[hashSlug(slug) % COVER_OVERLAYS.length]!;
}

export function getStoreCardFallbackClass(slug: string): string {
  return COVER_FALLBACKS[hashSlug(slug) % COVER_FALLBACKS.length]!;
}

/** Cap stagger so above-the-fold cards animate; deeper rows stay snappy. */
export function storeCardStaggerDelay(index: number): number {
  return Math.min(index, 5) * 0.045;
}
