/**
 * Concurrent-capped preload of next/image optimizer URLs for rack neighbors.
 * Shared across all PricingCategoryRack instances so a long page cannot stampede.
 */

/** Match `PricingCategoryPhoto` sizes so the warmed URL is the one the frame requests. */
export const PRICING_CATEGORY_PHOTO_SIZES =
  '(max-width: 1023px) calc(100vw - 2rem), (max-width: 1439px) 42vw, 580px';

/** Editorial photo aspect 4/3 @ ~2× of the 580px desktop slot. */
export const PRICING_PHOTO_PREFETCH_WIDTH = 1160;
export const PRICING_PHOTO_PREFETCH_HEIGHT = 870;

/** Max simultaneous neighbor downloads (page-wide). */
export const PRICING_PHOTO_PREFETCH_CONCURRENCY = 2;

/** Prefer this width band from srcSet (common phone @2× / mid desktop). */
const PREFERRED_SRCSET_MIN_W = 1080;

const warmed = new Set<string>();
const inflight = new Set<string>();
const pending: string[] = [];
let activeCount = 0;

/** Pick the srcSet candidate closest to the photo slot (or plain src). */
export function pickPricingPhotoPrefetchCandidate(
  src: string,
  srcSet?: string,
): string {
  if (!srcSet) return src;
  const candidates = srcSet.split(',').map((part) => {
    const [url, descriptor] = part.trim().split(/\s+/);
    const w =
      descriptor && descriptor.endsWith('w')
        ? Number(descriptor.slice(0, -1))
        : 0;
    return { url, w: Number.isFinite(w) ? w : 0 };
  });
  const preferred =
    candidates.find((c) => c.w >= PREFERRED_SRCSET_MIN_W) ?? candidates.at(-1);
  return preferred?.url || src;
}

/**
 * Enqueue a next/image URL. Dedupes warmed + in-flight + pending.
 * Safe to call from effects; no-ops on the server.
 */
export function enqueuePricingPhotoPrefetch(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url || warmed.has(url) || inflight.has(url) || pending.includes(url)) {
    return;
  }
  pending.push(url);
  pumpPrefetchQueue();
}

/** Drop not-yet-started work (e.g. when every rack is off-screen). */
export function clearPricingPhotoPrefetchQueue(): void {
  pending.length = 0;
}

/** Test / Storybook reset — do not call from product UI. */
export function resetPricingPhotoPrefetchStateForTests(): void {
  warmed.clear();
  inflight.clear();
  pending.length = 0;
  activeCount = 0;
}

function pumpPrefetchQueue(): void {
  while (
    activeCount < PRICING_PHOTO_PREFETCH_CONCURRENCY &&
    pending.length > 0
  ) {
    const url = pending.shift();
    if (!url || warmed.has(url) || inflight.has(url)) continue;

    activeCount += 1;
    inflight.add(url);

    const img = new window.Image();
    img.decoding = 'async';
    const finish = () => {
      warmed.add(url);
      inflight.delete(url);
      activeCount = Math.max(0, activeCount - 1);
      pumpPrefetchQueue();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = url;
  }
}
