/**
 * Slug/name → catalog photo key rules shared by pricing rack frames
 * and WashHouse catalog WebP tiles.
 */

/** Keys aligned with `PRICING_PRODUCT_PHOTOS` in pricing-product-images.ts */
export type CatalogPhotoKey =
  | 'wash_fold'
  | 'wash_iron'
  | 'premium_laundry'
  | 'dry_clean'
  | 'shoe_cleaning'
  | 'curtain_cleaning'
  | 'more_services'
  | 'shirt'
  | 'trouser'
  | 'shorts'
  | 'lower'
  | 'jogger'
  | 'kurta'
  | 'dhoti'
  | 'sherwani'
  | 'coat'
  | 'suit'
  | 'vest'
  | 'tie'
  | 'cap'
  | 'wallet'
  | 'hanky'
  | 'saree'
  | 'lehenga'
  | 'blouse'
  | 'gown'
  | 'skirt'
  | 'dress'
  | 'top'
  | 'dupatta'
  | 'frock'
  | 'purse'
  | 'bathrobe'
  | 'girl_dress'
  | 'sweater'
  | 'overcoat'
  | 'overcoat_leather'
  | 'jacket_denim'
  | 'jacket_puffer'
  | 'jacket_leather'
  | 'hoodie'
  | 'shawl'
  | 'bedsheet'
  | 'blanket'
  | 'comforter'
  | 'pillow'
  | 'shoes'
  | 'shoes_bag'
  | 'heels'
  | 'bag'
  | 'trolley'
  | 'carpet'
  | 'towel'
  | 'toy'
  | 'gloves'
  | 'membership';

/** Ordered rules — first match wins. Prefer slug fragments (stable). */
const CATALOG_PHOTO_RULES: ReadonlyArray<{
  key: CatalogPhotoKey;
  match: (slug: string, name: string) => boolean;
}> = [
  {
    key: 'wash_fold',
    match: (s, n) => s.includes('wash-fold') || n.includes('wash & fold'),
  },
  {
    key: 'wash_iron',
    match: (s, n) => s.includes('wash-iron') || n.includes('wash & iron'),
  },
  {
    key: 'overcoat_leather',
    match: (s, n) =>
      (s.includes('overcoat') && s.includes('leather')) ||
      (n.includes('overcoat') && n.includes('leather')),
  },
  {
    key: 'overcoat',
    match: (s, n) => s.includes('overcoat') || n.includes('overcoat'),
  },
  {
    key: 'jacket_leather',
    match: (s, n) =>
      (s.includes('jacket') && s.includes('leather')) ||
      (n.includes('jacket') && n.includes('leather')),
  },
  {
    key: 'jacket_puffer',
    match: (s, n) =>
      (s.includes('jacket') && s.includes('puffer')) ||
      (n.includes('jacket') && n.includes('puffer')),
  },
  {
    key: 'jacket_denim',
    match: (s, n) =>
      (s.includes('jacket') && (s.includes('denim') || s.includes('cotton'))) ||
      (n.includes('jacket') && (n.includes('denim') || n.includes('cotton'))),
  },
  {
    // Generic jacket / half-jacket without a material subtype
    key: 'jacket_denim',
    match: (s, n) => s.includes('jacket') || n.includes('jacket'),
  },
  {
    key: 'hoodie',
    match: (s, n) => s.includes('hoodie') || n.includes('hoodie'),
  },
  {
    key: 'sweater',
    match: (s, n) => s.includes('sweater') || n.includes('sweater'),
  },
  {
    key: 'shawl',
    match: (s, n) => s.includes('shawl') || n.includes('shawl'),
  },
  {
    // Word/slug boundary — do not match “petticoat”
    key: 'coat',
    match: (s, n) =>
      /(^|-)coat(-|$)/.test(s) || /\bcoat\b/.test(n),
  },
  {
    key: 'skirt',
    match: (s, n) => s.includes('petticoat') || n.includes('petticoat'),
  },
  {
    key: 'gown',
    match: (s, n) => s.includes('burkha') || n.includes('burkha'),
  },
  {
    key: 'lower',
    match: (s, n) =>
      s.includes('patiala') ||
      s.includes('salwar') ||
      n.includes('patiala') ||
      n.includes('salwar'),
  },
  {
    key: 'cap',
    match: (s, n) => s.includes('turban') || n.includes('turban'),
  },
  {
    key: 'suit',
    match: (s, n) => s.includes('suit') || n.includes('suit'),
  },
  {
    key: 'sherwani',
    match: (s, n) => s.includes('sherwani') || n.includes('sherwani'),
  },
  {
    key: 'lehenga',
    match: (s, n) => s.includes('lehenga') || n.includes('lehenga'),
  },
  {
    key: 'saree',
    match: (s, n) => s.includes('saree') || n.includes('saree'),
  },
  {
    key: 'blouse',
    match: (s, n) =>
      s.includes('blouse') ||
      s.includes('choli') ||
      n.includes('blouse') ||
      n.includes('choli'),
  },
  {
    key: 'gown',
    match: (s, n) =>
      s.includes('gown') ||
      s.includes('anarkali') ||
      n.includes('gown') ||
      n.includes('anarkali'),
  },
  {
    key: 'girl_dress',
    match: (s, n) => s.includes('girl-dress') || n.includes('girl dress'),
  },
  {
    key: 'frock',
    match: (s, n) => s.includes('frock') || n.includes('frock'),
  },
  {
    key: 'dress',
    match: (s, n) =>
      s.includes('full-dress') ||
      s.includes('full_dress') ||
      n.includes('full dress'),
  },
  {
    key: 'skirt',
    match: (s, n) => s.includes('skirt') || n.includes('skirt'),
  },
  {
    key: 'dupatta',
    match: (s, n) => s.includes('dupatta') || n.includes('dupatta'),
  },
  {
    key: 'top',
    match: (s, n) =>
      s.includes('top-kurti') ||
      s.includes('kurti') ||
      n.includes('kurti') ||
      n.includes('top /'),
  },
  {
    key: 'kurta',
    match: (s, n) =>
      s.includes('kurta') ||
      s.includes('kameez') ||
      n.includes('kurta') ||
      n.includes('kameez'),
  },
  {
    key: 'bathrobe',
    match: (s, n) => s.includes('bathrobe') || n.includes('bathrobe'),
  },
  {
    key: 'purse',
    match: (s, n) => s.includes('purse') || n.includes('purse'),
  },
  {
    key: 'shirt',
    match: (s, n) =>
      s.includes('shirt') ||
      s.includes('tshirt') ||
      n.includes('shirt') ||
      n.includes('t-shirt'),
  },
  {
    key: 'trouser',
    match: (s, n) =>
      s.includes('trouser') ||
      s.includes('jeans') ||
      n.includes('trouser') ||
      n.includes('jeans'),
  },
  {
    key: 'jogger',
    match: (s, n) =>
      s.includes('jogger') ||
      s.includes('cargo') ||
      n.includes('jogger') ||
      n.includes('cargo'),
  },
  {
    key: 'shorts',
    match: (s, n) => s.includes('shorts') || n.includes('shorts'),
  },
  {
    key: 'lower',
    match: (s, n) => s.includes('lower') || n === 'lower',
  },
  {
    key: 'dhoti',
    match: (s, n) =>
      s.includes('dhoti') ||
      s.includes('lungi') ||
      n.includes('dhoti') ||
      n.includes('lungi'),
  },
  {
    key: 'vest',
    match: (s, n) =>
      s.includes('vest') ||
      s.includes('waistcoat') ||
      n.includes('vest') ||
      n.includes('waistcoat'),
  },
  {
    key: 'tie',
    match: (s, n) => s.includes('tie') || n === 'tie',
  },
  {
    key: 'wallet',
    match: (s, n) => s.includes('wallet') || n.includes('wallet'),
  },
  {
    key: 'cap',
    match: (s, n) => s.includes('cap') || n.includes('cap'),
  },
  {
    key: 'hanky',
    match: (s, n) => s.includes('hanky') || n.includes('hanky'),
  },
  {
    key: 'comforter',
    match: (s, n) => s.includes('comforter') || n.includes('comforter'),
  },
  {
    key: 'blanket',
    match: (s, n) => s.includes('blanket') || n.includes('blanket'),
  },
  {
    key: 'bedsheet',
    match: (s, n) => s.includes('bedsheet') || n.includes('bedsheet'),
  },
  {
    key: 'pillow',
    match: (s, n) =>
      s.includes('pillow') ||
      s.includes('cushion') ||
      n.includes('pillow') ||
      n.includes('cushion'),
  },
  {
    key: 'heels',
    match: (s, n) => s.includes('heels') || n.includes('heels'),
  },
  {
    key: 'shoes',
    match: (s, n) => s.includes('shoes') || n.includes('shoes'),
  },
  {
    key: 'trolley',
    match: (s, n) => s.includes('trolley') || n.includes('trolley'),
  },
  {
    key: 'bag',
    match: (s, n) => s.includes('bag') || n.includes('bag'),
  },
  {
    key: 'carpet',
    match: (s, n) => s.includes('carpet') || n.includes('carpet'),
  },
  {
    key: 'towel',
    match: (s, n) => s.includes('towel') || n.includes('towel'),
  },
  {
    key: 'toy',
    match: (s, n) => s.includes('toy') || n.includes('toy'),
  },
  {
    key: 'gloves',
    match: (s, n) => s.includes('gloves') || n.includes('gloves'),
  },
];

export function resolveCatalogPhotoKey(
  slug: string,
  name: string,
): CatalogPhotoKey | null {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  for (const rule of CATALOG_PHOTO_RULES) {
    if (rule.match(s, n)) return rule.key;
  }
  return null;
}
