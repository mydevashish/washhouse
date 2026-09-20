export const PROMO_STORAGE_KEY = 'washhouse.promo.dryclean-25-20260921';

/** Inclusive offer window (IST). */
export const PROMO_START_ISO = '2026-09-21T00:00:00+05:30';
export const PROMO_END_ISO = '2026-10-21T23:59:59+05:30';

export const PROMO_COPY = {
  badge: '',
  headline: '',
  service: 'Dry Clean only',
  validity: 'Offer valid from 21 September 2026 to 21 October 2026',
  validityShort: '21 Sep 2026 – 21 Oct 2026',
} as const;

export function isPromoOfferActive(now = new Date()): boolean {
  const start = new Date(PROMO_START_ISO);
  const end = new Date(PROMO_END_ISO);
  return now >= start && now <= end;
}
