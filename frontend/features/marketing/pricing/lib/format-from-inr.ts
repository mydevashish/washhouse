import { formatRupee, rupeeAriaLabel } from '@/features/laundry-price-list/lib/format-inr';

/** Display “from ₹X” for indicative marketplace floors. */
export function formatFromRupee(inr: string | null | undefined): string {
  if (inr == null || inr === '') return '—';
  return `${formatRupee(inr)}`;
}

export function fromRupeeAriaLabel(inr: string | null | undefined): string {
  if (inr == null || inr === '') return 'Not available';
  return `starting from ${rupeeAriaLabel(inr)}`;
}
