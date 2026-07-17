import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';
import type { PricingFromGroup } from '@/features/marketing/pricing/lib/group-from-categories';

export type PricingTagLine = {
  /** Service label when the category shows multiple rate types; null for single-rate. */
  service: string | null;
  amountInr: string | null;
};

/** Build display lines for a hanging price tag from group column flags. */
export function getPricingTagLines(
  item: MarketplaceFromItem,
  group: Pick<PricingFromGroup, 'showDryClean' | 'showPress' | 'showSingleRate'>,
): PricingTagLine[] {
  const lines: PricingTagLine[] = [];

  if (group.showSingleRate && item.from_price_inr != null) {
    lines.push({ service: null, amountInr: item.from_price_inr });
  }

  if (group.showDryClean && item.from_dry_clean_inr != null) {
    const needsLabel = group.showPress || group.showSingleRate;
    lines.push({
      service: needsLabel ? 'Dry clean' : null,
      amountInr: item.from_dry_clean_inr,
    });
  }

  if (group.showPress && item.from_press_inr != null) {
    lines.push({
      service: 'Press',
      amountInr: item.from_press_inr,
    });
  }

  if (lines.length === 0) {
    lines.push({ service: null, amountInr: null });
  }

  return lines;
}
