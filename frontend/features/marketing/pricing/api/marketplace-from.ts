import type {
  MarketplaceFromItem,
  MarketplaceFromResponse,
} from '@/features/marketing/pricing/types';
import { washhouseSuggestedFromItems } from '@/features/marketing/pricing/washhouse-suggested-from';
import { abortSignalAfter } from '@/lib/abort-signal-after';

type Envelope = { data: MarketplaceFromResponse };

/** Cap build/SSR waits so a down or firewalled API cannot stall `next build`. */
export const MARKETPLACE_FROM_FETCH_TIMEOUT_MS = 5_000;

/**
 * Load marketplace “from” rows for /pricing.
 * Prefers live aggregates; falls back to full WashHouse suggested guide
 * (all catalog categories) so the page never blanks on API failure/empty.
 */
export async function loadMarketplaceFromItems(): Promise<MarketplaceFromItem[]> {
  const fallback = washhouseSuggestedFromItems();
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return fallback;

  try {
    const res = await fetch(`${base}/catalog/marketplace-from`, {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
      signal: abortSignalAfter(MARKETPLACE_FROM_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return fallback;

    const json = (await res.json()) as Envelope;
    const items = json.data?.items ?? [];
    if (items.length === 0) return fallback;
    return items;
  } catch {
    return fallback;
  }
}
