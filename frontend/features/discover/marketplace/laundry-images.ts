/** Curated Unsplash images for laundry partners and hero. */

/** Verified Unsplash IDs (broken legacy URLs returned 404 and hurt LCP). */
const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = U('photo-1558618666-fcd25c85cd64', 800);

/** Verified IDs for marketing hero carousel (broken legacy URLs returned 404). */
export const HERO_SLIDE_IMAGES = {
  /** Folded fresh laundry — welcome slide */
  primary: U('photo-1558618666-fcd25c85cd64', 1200),
  /** Professional laundry facility — services slide */
  compare: U('photo-1571902943202-507ec2618e8f', 1200),
  /** Small business owner — franchise slide (distinct from facility) */
  partner: U('photo-1600880292203-757bb62b4baf', 1200),
  /** Pickup / delivery — delivery slide */
  doorstep: U('photo-1517677208171-0bc6725a3e60', 1200),
} as const;

export const LAUNDRY_IMAGES_BY_SLUG: Record<string, string> = {
  'demo-quick-wash-koramangala': U('photo-1558618666-fcd25c85cd64', 800),
  'demo-sparkle-indiranagar': U('photo-1571902943202-507ec2618e8f', 800),
  'demo-freshfold-hsr': U('photo-1517677208171-0bc6725a3e60', 800),
};

const FALLBACK_POOL = [
  U('photo-1558618666-fcd25c85cd64', 800),
  U('photo-1517677208171-0bc6725a3e60', 800),
];

export function getLaundryImage(slug: string, index: number): string {
  return LAUNDRY_IMAGES_BY_SLUG[slug] ?? FALLBACK_POOL[index % FALLBACK_POOL.length]!;
}

/** Stable pseudo-random meta from slug for demo UI (distance/delivery only). */
export function getPartnerMeta(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i) * (i + 1)) % 997;
  const distanceKm = (1.2 + (hash % 28) / 10).toFixed(1);
  const deliveryMin = 25 + (hash % 25);
  return { distanceKm, deliveryMin };
}
