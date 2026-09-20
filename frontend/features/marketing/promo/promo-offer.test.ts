import { isPromoOfferActive, PROMO_END_ISO, PROMO_START_ISO } from '@/features/marketing/promo/promo-offer';

describe('isPromoOfferActive', () => {
  it('is inactive before the start date', () => {
    expect(isPromoOfferActive(new Date('2026-09-20T23:59:00+05:30'))).toBe(false);
  });

  it('is active on the start and end dates', () => {
    expect(isPromoOfferActive(new Date(PROMO_START_ISO))).toBe(true);
    expect(isPromoOfferActive(new Date(PROMO_END_ISO))).toBe(true);
  });

  it('is inactive after the end date', () => {
    expect(isPromoOfferActive(new Date('2026-10-22T00:00:00+05:30'))).toBe(false);
  });
});
