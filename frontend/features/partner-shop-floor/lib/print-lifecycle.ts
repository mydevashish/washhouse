/**
 * Print lifecycle helpers for Customers & Orders Hub (P5).
 * Tags after create; bill/GST when ready for handover or collected.
 */

export const PRINT_BILL_EMPHASIS_STATUSES = [
  'ready',
  'out_for_delivery',
  'delivered',
] as const;

export type PrintBillEmphasisStatus = (typeof PRINT_BILL_EMPHASIS_STATUSES)[number];

export type PrintLifecycleEmphasis = 'tags' | 'bill';

/** Ready / out for delivery / delivered → emphasize bill; otherwise tags. */
export function getPrintLifecycleEmphasis(
  status: string | null | undefined,
): PrintLifecycleEmphasis {
  const normalized = (status ?? '').trim().toLowerCase();
  if ((PRINT_BILL_EMPHASIS_STATUSES as readonly string[]).includes(normalized)) {
    return 'bill';
  }
  return 'tags';
}

export function shouldEmphasizePrintBill(status: string | null | undefined): boolean {
  return getPrintLifecycleEmphasis(status) === 'bill';
}

/** Bill + GST invoice print routes — ready / handover / collected (hub P5). */
export function canPrintBillOrInvoice(status: string | null | undefined): boolean {
  return shouldEmphasizePrintBill(status);
}

/** English copy for detail / row print panels. */
export function getPrintLifecycleHint(status: string | null | undefined): string {
  if (shouldEmphasizePrintBill(status)) {
    return 'Order is ready for handover — print the bill or GST invoice.';
  }
  return 'Print garment tags so bags stay matched on the floor.';
}

export function buildPartnerPrintPath(
  orderId: string,
  kind: 'tags' | 'bill' | 'invoice',
): string {
  return `/partner/floor/print/${orderId}/${kind}`;
}

export const PARTNER_PRINT_CENTER_HREF = '/partner/floor/print';
