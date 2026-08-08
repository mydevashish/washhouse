/** Pure helpers for partner bill / GST invoice display (reprint-safe frozen amounts). */

export function moneyInr(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export function halfGstRate(gstRate: string | number): string {
  const n = typeof gstRate === 'number' ? gstRate : Number(gstRate);
  if (!Number.isFinite(n)) return '0.00';
  return (n / 2).toFixed(2);
}

export function formatGstLineLabel(kind: 'CGST' | 'SGST', gstRate: string | number): string {
  return `${kind} (${halfGstRate(gstRate)}%)`;
}

/** Display-only check that frozen CGST+SGST+subtotal(+delivery) matches total. */
export function gstTotalsConsistent(payload: {
  subtotal_inr: string | number;
  delivery_fee_inr?: string | number;
  cgst_inr: string | number;
  sgst_inr: string | number;
  total_inr: string | number;
}): boolean {
  const sub = Number(payload.subtotal_inr);
  const delivery = Number(payload.delivery_fee_inr ?? 0);
  const cgst = Number(payload.cgst_inr);
  const sgst = Number(payload.sgst_inr);
  const total = Number(payload.total_inr);
  const sum = Math.round((sub + delivery + cgst + sgst) * 100) / 100;
  return Math.abs(sum - total) < 0.02;
}
