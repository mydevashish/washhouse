import { formatInr } from '@/features/discover/detail/order-pricing';

/** Compact INR for KPI cards (e.g. ₹12.5L). */
export function formatInrCompact(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return formatInr(amount);
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-IN');
}
