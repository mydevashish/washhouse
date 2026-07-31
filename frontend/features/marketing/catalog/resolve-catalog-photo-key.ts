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
  | 'kurta_m'
  | 'kameez_normal'
  | 'kameez_fancy'
  | 'dhoti'
  | 'sherwani_cotton'
  | 'sherwani_wedding'
  | 'coat_formal'
  | 'coat_heavy'
  | 'petticoat'
  | 'suit'
  | 'suit_2pcs'
  | 'suit_3pcs'
  | 'vest'
  | 'waistcoat'
  | 'tie'
  | 'cap_fabric'
  | 'cap_leather'
  | 'winter_cap'
  | 'turban'
  | 'wallet'
  | 'hanky'
  | 'saree_normal'
  | 'saree_heavy'
  | 'lehenga_normal'
  | 'lehenga_heavy'
  | 'blouse_choli_heavy'
  | 'blouse_choli_normal'
  | 'gown'
  | 'skirt_short'
  | 'skirt_long'
  | 'dress_normal'
  | 'dress_party'
  | 'top'
  | 'dupatta'
  | 'frock_normal'
  | 'frock_heavy'
  | 'purse_small'
  | 'purse_medium'
  | 'purse_large'
  | 'bathrobe'
  | 'girl_dress'
  | 'girl_dupatta'
  | 'girl_frock'
  | 'kids_full_jacket_leather'
  | 'kids_full_jacket_normal'
  | 'kids_half_jacket_leather'
  | 'kids_half_jacket_normal'
  | 'sweater_kids'
  | 'sweater_men_women'
  | 'overcoat_kids'
  | 'overcoat'
  | 'overcoat_leather'
  | 'jacket_denim'
  | 'jacket_puffer'
  | 'jacket_leather'
  | 'half_jacket_denim'
  | 'half_jacket_puffer'
  | 'half_jacket_leather'
  | 'hoodie'
  | 'shawl'
  | 'bedsheet_single'
  | 'bedsheet_double'
  | 'blanket_single'
  | 'blanket_double'
  | 'blanket_king'
  | 'comforter_single'
  | 'comforter_double'
  | 'pillow'
  | 'shoes'
  | 'shoes_sports'
  | 'shoes_leather'
  | 'shoes_bag'
  | 'heels'
  | 'bag_small'
  | 'bag_large'
  | 'trolley_small'
  | 'trolley_large'
  | 'trolley_medium'
  | 'carpet_small'
  | 'carpet_medium'
  | 'carpet_large'
  | 'towel'
  | 'toy_small'
  | 'toy_medium'
  | 'toy_large'
  | 'cotton_gloves'
  | 'leather_gloves'
  | 'membership'
  | 'burkha'
  | 'salwar'
  | 'kurta_w';

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
    key: 'overcoat_kids',
    match: (s, n) => s.includes('overcoat (kids)') || n.includes('overcoat (kids)'),
  },
  {
    key: 'overcoat',
    match: (s, n) => s.includes('overcoat') || n.includes('overcoat'),
  },
  {
    key: 'kids_full_jacket_leather',
    match: (s, n) => s.includes('kids-full-jacket-leather') || n.includes('full jacket (leather)'),
  },
  {
    key: 'kids_full_jacket_normal',
    match: (s, n) => s.includes('kids-full-jacket-normal') || n.includes('full jacket (normal)'),
  },
  {
    key: 'kids_half_jacket_leather',
    match: (s, n) => s.includes('kids-half-jacket-leather') || n.includes('half jacket (leather)'),
  },
  {
    key: 'kids_half_jacket_normal',
    match: (s, n) => s.includes('kids-half-jacket-normal') || n.includes('half jacket (normal)'),
  },
  {
    key: 'jacket_leather',
    match: (s, n) =>
      (s.includes('jacket') && s.includes('leather') && !s.includes('half')) ||
      (n.includes('jacket') && n.includes('leather') && !n.includes('half')),
  },
  {
    key: 'jacket_puffer',
    match: (s, n) =>
      (s.includes('jacket') && s.includes('puffer') && !s.includes('half')) ||
      (n.includes('jacket') && n.includes('puffer') && !n.includes('half')),
  },
  {
  key: 'half_jacket_denim',
    match: (s, n) =>
      (
        s.includes('half') &&
        s.includes('jacket') &&
        (s.includes('denim') || s.includes('cotton'))
      ) ||
      (
        n.includes('half') &&
        n.includes('jacket') &&
        (n.includes('denim') || n.includes('cotton'))
      ),
  },
  {
    key: 'jacket_denim',
    match: (s, n) =>
      (
        s.includes('jacket') &&
        !s.includes('half') &&
        (s.includes('denim') || s.includes('cotton'))
      ) ||
      (
        n.includes('jacket') &&
        !n.includes('half') &&
        (n.includes('denim') || n.includes('cotton'))
      ),
  },
  {
    key: 'half_jacket_leather',
    match: (s, n) =>
      (s.includes('half') && s.includes('jacket') && s.includes('leather')) ||
      (n.includes('half') && n.includes('jacket') && n.includes('leather')),
  },
  {
    key: 'half_jacket_puffer',
    match: (s, n) =>
      (s.includes('half') && s.includes('jacket') && s.includes('puffer')) ||
      (n.includes('half') && n.includes('jacket') && n.includes('puffer')),
  },
  {
    key: 'hoodie',
    match: (s, n) => s.includes('hoodie') || n.includes('hoodie'),
  },
  {
    key: 'sweater_kids',
    match: (s, n) => s.includes('sweater (kids)') || n.includes('sweater (kids)'),
  },
  {
    key: 'sweater_men_women',
    match: (s, n) =>
      (s.includes('sweater') && s.includes('men')) ||
      (n.includes('sweater') && n.includes('men')),
  },
  {
    key: 'shawl',
    match: (s, n) => s.includes('shawl') || n.includes('shawl'),
  },
  {
    key: 'petticoat',
    match: (s, n) => s.includes('petticoat') || n.includes('petticoat'),
  },
  {
    key: 'coat_formal',
    match: (s, n) => s.includes('coat_formal') || n.includes('coat (formal)'),
  },
  {
    key: 'coat_heavy',
    match: (s, n) => s.includes('coat_heavy') || n.includes('coat (heavy)'),
  },  
  {
    key: 'skirt_long',
    match: (s, n) => s.includes('skirt-long') || n.includes('skirt-long'),
  },
  {
    key: 'skirt_short',
    match: (s, n) => s.includes('skirt') || n.includes('skirt-short'),
  },
  {
    key: 'burkha',
    match: (s, n) => s.includes('burkha') || n.includes('burkha'),
  },
  {
    key: 'salwar',
    match: (s, n) => s.includes('salwar') || n.includes('salwar'),
  },
  {
    key: 'turban',
    match: (s, n) => s.includes('turban') || n.includes('turban'),
  },
  {
    key: 'suit_2pcs',
    match: (s, n) => s.includes('suit_2pcs') || n.includes('suit 2 pcs'),
  },
  {
    key: 'suit_3pcs',
    match: (s, n) => s.includes('suit_2pcs') || n.includes('suit 3 pcs'),
  },
  {
    key: 'sherwani_cotton',
    match: (s, n) => s.includes('sherwani-cotton') || n.includes('sherwani (cotton)'),
  },
  {
    key: 'sherwani_wedding',
    match: (s, n) => s.includes('sherwani-wedding') || n.includes('sherwani (wedding)'),
  },
  {
    key: 'lehenga_normal',
    match: (s, n) => s.includes('lehenga-normal') || n.includes('lehenga-normal'),
  },
  {
    key: 'lehenga_heavy',
    match: (s, n) => s.includes('lehenga-heavy') || n.includes('lehenga-heavy'),
  },
  {
    key: 'saree_normal',
    match: (s, n) => s.includes('saree-normal') || n.includes('saree-normal'),
  },
  {
    key: 'saree_heavy',
    match: (s, n) => s.includes('saree-heavy') || n.includes('saree-heavy'),
  },
  {
    key: 'blouse_choli_normal',
    match: (s, n) => s.includes('blouse-choli-normal') || n.includes('blouse-choli-normal'),
  },
  {
    key: 'blouse_choli_heavy',
    match: (s, n) => s.includes('blouse-choli-heavy') || n.includes('blouse-choli-heavy'),
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
    key: 'girl_dupatta',
    match: (s, n) => s.includes('girl-dupatta') || n.includes('girl-dupatta'),
  },
  {
    key: 'girl_frock',
    match: (s, n) => s.includes('frock') || n.includes('frock'),
  },  
  {
    key: 'frock_normal',
    match: (s, n) => s.includes('frock-normal') || n.includes('frock-normal'),
  },
  {
    key: 'frock_heavy',
    match: (s, n) => s.includes('frock-heavy') || n.includes('frock-heavy'),
  },
  {
    key: 'dress_normal',
    match: (s, n) => s.includes('dress-normal') || n.includes('dress-normal'),
  },
  {
    key: 'dress_party',
    match: (s, n) => s.includes('dress-party') || n.includes('dress-party'),
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
    key: 'kurta_m',
    match: (s, n) => s.includes('kurta') || n.includes('kurta'),
  },
  {
    key: 'kurta_w',
    match: (s, n) => s.includes('kurti') || n.includes('kurti'),
  },
  {
    key: 'kameez_normal',
    match: (s, n) => s.includes('kameez-normal') || n.includes('kameez-normal'),
  },
  {
    key: 'kameez_fancy',
    match: (s, n) => s.includes('kameez-fancy') || n.includes('kameez-fancy'),
  },
  {
    key: 'bathrobe',
    match: (s, n) => s.includes('bathrobe') || n.includes('bathrobe'),
  },
  {
    key: 'purse_small',
    match: (s, n) => s.includes('purse-s') || n.includes('purse-s'),
  },
  {
    key: 'purse_medium',
    match: (s, n) => s.includes('purse-m') || n.includes('purse-m'),
  },
  {
    key: 'purse_large',
    match: (s, n) => s.includes('purse-l') || n.includes('purse-l'),
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
    match: (s, n) => s.includes('vest') || n === 'vest',
  },
  {
    key: 'waistcoat',
    match: (s, n) => s.includes('waistcoat') || n === 'waistcoat',
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
    key: 'cap_fabric',
    match: (s, n) => s.includes('cap-fabric') || n.includes('cap (fabric)'),
  },
  {
    key: 'cap_leather',
    match: (s, n) => s.includes('cap-leather') || n.includes('cap (leather)'),
  },
  {
    key: 'winter_cap',
    match: (s, n) => s.includes('winter-cap') || n.includes('Winter Cap'),
  },
  {
    key: 'hanky',
    match: (s, n) => s.includes('hanky') || n.includes('hanky'),
  },
  {
    key: 'comforter_single',
    match: (s, n) => s.includes('comforter-single') || n.includes('comforter (single)'),
  },
  {
    key: 'comforter_double',
    match: (s, n) => s.includes('comforter-double') || n.includes('comforter (double)'),
  },
  {
    key: 'blanket_single',
    match: (s, n) =>
      s.includes('blanket-single') ||
      n.includes('blanket (single)'),
  },
  {
    key: 'blanket_double',
    match: (s, n) =>
      s.includes('blanket-double') ||
      n.includes('blanket (double)'),
  },
  {
    key: 'blanket_king',
    match: (s, n) =>
      s.includes('blanket-king') ||
      n.includes('blanket (king)'),
  },
  {
  key: 'bedsheet_single',
    match: (s, n) =>
      s.includes('bedsheet-single') ||
      n.includes('bedsheet (single)'),
  },
  {
    key: 'bedsheet_double',
    match: (s, n) =>
      s.includes('bedsheet-double') ||
      n.includes('bedsheet (double)'),
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
    key: 'shoes_sports',
    match: (s, n) => s.includes('shoes-sports') || n.includes('shoes (sports)'),
  },
  {
    key: 'shoes_leather',
    match: (s, n) => s.includes('shoes-leather') || n.includes('shoes (leather)'),
  },
  {
    key: 'shoes',
    match: (s, n) => s.includes('shoes') || n.includes('shoes'),
  },  
  {
    key: 'trolley_small',
    match: (s, n) => s.includes('trolley-small') || n.includes('trolley (small)'),
  },
  {
    key: 'trolley_medium',
    match: (s, n) => s.includes('trolley-medium') || n.includes('trolley (medium)'),
  },
  {
    key: 'trolley_large',
    match: (s, n) => s.includes('trolley-large') || n.includes('trolley (large)'),
  },
  {
    key: 'bag_small',
    match: (s, n) => s.includes('bag-small') || n.includes('bag (small)'),
  },
   {
    key: 'bag_large',
    match: (s, n) => s.includes('bag-large') || n.includes('bag (large)'),
  },
  {
    key: 'carpet_small',
    match: (s, n) => s.includes('carpet-small') || n.includes('carpet (small)'),
  },
  {
    key: 'carpet_medium',
    match: (s, n) => s.includes('carpet-medium') || n.includes('carpet (medium)'),
  },
  {
    key: 'carpet_large',
    match: (s, n) => s.includes('carpet-large') || n.includes('carpet (large)'),
  },
  {
    key: 'towel',
    match: (s, n) => s.includes('towel') || n.includes('towel'),
  },
  {
    key: 'toy_small',
    match: (s, n) =>
      s.includes('toy-small') ||
      n.includes('toy (small)'),
  },
  {
    key: 'toy_medium',
    match: (s, n) =>
      s.includes('toy-medium') ||
      n.includes('toy (medium)'),
  },
  {
    key: 'toy_large',
    match: (s, n) =>
      s.includes('toy-large') ||
      n.includes('toy (large)'),
  },
  {
    key: 'cotton_gloves',
    match: (s, n) => s.includes('cotton-gloves') || n.includes('cotton gloves'),
  },
  {
    key: 'leather_gloves',
    match: (s, n) => s.includes('leather-gloves') || n.includes('leather gloves'),
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
