import { formatRupee } from '@/features/laundry-price-list/lib/format-inr';
import type { LaundryListItem } from '@/services/laundries';

export type ComparePriceLine = {
  key: 'wash_fold' | 'shirt';
  label: string;
  amountLabel: string;
  unitSuffix?: string;
};

/** Compact “from ₹X” lines for store/discover cards when owner prices exist. */
export function getComparePriceLines(laundry: LaundryListItem): ComparePriceLine[] {
  const lines: ComparePriceLine[] = [];
  if (laundry.wash_fold_from_inr) {
    lines.push({
      key: 'wash_fold',
      label: 'Wash & Fold',
      amountLabel: formatRupee(laundry.wash_fold_from_inr),
      unitSuffix: '/kg',
    });
  }
  if (laundry.shirt_dry_clean_from_inr) {
    lines.push({
      key: 'shirt',
      label: 'Shirt dry-clean',
      amountLabel: formatRupee(laundry.shirt_dry_clean_from_inr),
    });
  }
  return lines;
}

export function comparePriceAriaSummary(laundry: LaundryListItem): string | null {
  const lines = getComparePriceLines(laundry);
  if (!lines.length) return null;
  return lines
    .map((l) => `from ${l.amountLabel}${l.unitSuffix ?? ''} ${l.label}`)
    .join(', ');
}
