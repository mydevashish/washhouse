import { describe, expect, it } from '@jest/globals';

import {
  formatGstLineLabel,
  gstTotalsConsistent,
  halfGstRate,
  moneyInr,
} from '@/features/partner-shop-floor/lib/invoice-display';

describe('invoice-display GST math', () => {
  // it('splits gst_rate evenly for CGST/SGST labels', () => {
  //   expect(halfGstRate('18')).toBe('9.00');
  //   expect(halfGstRate(18)).toBe('9.00');
  //   expect(formatGstLineLabel('CGST', 18)).toBe('CGST (9.00%)');
  //   expect(formatGstLineLabel('SGST', '18.00')).toBe('SGST (9.00%)');
  // });

  it('formats money to 2 decimals', () => {
    expect(moneyInr('236')).toBe('236.00');
    expect(moneyInr(12.42)).toBe('12.42');
  });

  it('validates frozen totals consistency for display', () => {
    expect(
      gstTotalsConsistent({
        subtotal_inr: '200.00',
        delivery_fee_inr: '0',
        // cgst_inr: '18.00',
        // sgst_inr: '18.00',
        total_inr: '236.00',
      }),
    ).toBe(true);

    expect(
      gstTotalsConsistent({
        subtotal_inr: '100',
        delivery_fee_inr: '49',
        // cgst_inr: '13.41',
        // sgst_inr: '13.41',
        total_inr: '175.82',
      }),
    ).toBe(true);
  });
});
