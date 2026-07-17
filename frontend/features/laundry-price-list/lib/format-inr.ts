/** Format INR decimal strings for customer display (₹ prefix, drop trailing .00). */

export function formatRupee(inr: string | null | undefined): string {
  if (inr == null || inr === '') return '—';
  const n = Number(inr);
  if (Number.isNaN(n)) return `₹${inr}`;
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  return `₹${formatted}`;
}

export function rupeeAriaLabel(inr: string | null | undefined): string {
  if (inr == null || inr === '') return 'Not available';
  const n = Number(inr);
  if (Number.isNaN(n)) return `${inr} rupees`;
  return `${n} rupees`;
}
