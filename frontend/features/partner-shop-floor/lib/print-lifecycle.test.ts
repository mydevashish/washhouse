import {
  PARTNER_PRINT_CENTER_HREF,
  buildPartnerPrintPath,
  getPrintLifecycleEmphasis,
  getPrintLifecycleHint,
  shouldEmphasizePrintBill,
} from '@/features/partner-shop-floor/lib/print-lifecycle';

describe('print-lifecycle', () => {
  it('emphasizes tags for early statuses', () => {
    expect(getPrintLifecycleEmphasis('confirmed')).toBe('tags');
    expect(getPrintLifecycleEmphasis('washing')).toBe('tags');
    expect(getPrintLifecycleEmphasis('ironing')).toBe('tags');
    expect(getPrintLifecycleEmphasis(undefined)).toBe('tags');
  });

  it('emphasizes bill for ready / handover statuses', () => {
    expect(getPrintLifecycleEmphasis('ready')).toBe('bill');
    expect(getPrintLifecycleEmphasis('out_for_delivery')).toBe('bill');
    expect(getPrintLifecycleEmphasis('delivered')).toBe('bill');
    expect(shouldEmphasizePrintBill('READY')).toBe(true);
  });

  it('returns English hints', () => {
    expect(getPrintLifecycleHint('ready')).toMatch(/bill|invoice/i);
    expect(getPrintLifecycleHint('washing')).toMatch(/tags/i);
  });

  it('builds print paths and print center href', () => {
    expect(buildPartnerPrintPath('ord-1', 'tags')).toBe('/partner/floor/print/ord-1/tags');
    expect(buildPartnerPrintPath('ord-1', 'bill')).toBe('/partner/floor/print/ord-1/bill');
    expect(buildPartnerPrintPath('ord-1', 'invoice')).toBe('/partner/floor/print/ord-1/invoice');
    expect(PARTNER_PRINT_CENTER_HREF).toBe('/partner/floor/print');
  });
});
