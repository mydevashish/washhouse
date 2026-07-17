import type { CatalogCategory } from '@/features/laundry-price-list/types';
import {
  getPricingCategoryImage,
  type PricingCategoryImage,
} from '@/features/marketing/pricing/pricing-category-images';

/** Request wide enough for 5/12 of 1440 @2x without soft upscales. */
const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * Garment-family editorial frames for scroll-synced rack photos.
 * Matched by catalog slug / name — falls back to category hero when unknown.
 */
export const PRICING_PRODUCT_PHOTOS = {
  wash_fold: {
    src: U('photo-1558618666-fcd25c85cd64'),
    alt: 'Neatly folded laundry stacks after wash and fold',
  },
  wash_iron: {
    src: U('photo-1582735689369-4fe89db7114c'),
    alt: 'Freshly pressed shirts stacked after wash and iron',
  },
  shirt: {
    src: U('photo-1489987707025-afc232f7ea96'),
    alt: 'Pressed dress shirts hanging on a laundry rail',
  },
  trouser: {
    src: U('photo-1542272604-787c3835535d'),
    alt: 'Folded jeans and trousers ready after care',
  },
  shorts: {
    src: U('photo-1591195853828-11db59a44f6b'),
    alt: 'Casual shorts folded after laundry service',
  },
  lower: {
    src: U('photo-1552902865-b72c031ac5ea'),
    alt: 'Soft lounge lowers folded after wash',
  },
  jogger: {
    src: U('photo-1552902865-b72c031ac5ea'),
    alt: 'Joggers and cargo pants after professional care',
  },
  kurta: {
    src: U('photo-1594938298603-c8148c4dae35'),
    alt: 'Cotton kurta hung after dry cleaning',
  },
  dhoti: {
    src: U('photo-1616986491129-3e37cb654c82'),
    alt: 'Traditional draped cotton fabric after laundry care',
  },
  sherwani: {
    src: U('photo-1594938298603-c8148c4dae35'),
    alt: 'Formal sherwani ready after dry clean and press',
  },
  coat: {
    src: U('photo-1539533018447-63fcce2678e3'),
    alt: 'Tailored overcoat hung after dry cleaning',
  },
  suit: {
    src: U('photo-1594938298603-c8148c4dae35'),
    alt: 'Formal suit on a hanger after professional care',
  },
  vest: {
    src: U('photo-1507679799987-c73779587ccf'),
    alt: 'Waistcoat and vest after press service',
  },
  tie: {
    src: U('photo-1588854337115-1c67d9247e4d'),
    alt: 'Silk ties arranged after dry cleaning',
  },
  cap: {
    src: U('photo-1588854337236-6889d595c0e9'),
    alt: 'Fabric cap after professional cleaning',
  },
  wallet: {
    src: U('photo-1627123424574-724758594f93'),
    alt: 'Leather wallet after careful cleaning',
  },
  hanky: {
    src: U('photo-1558618666-fcd25c85cd64'),
    alt: 'Fresh handkerchiefs after laundry care',
  },
  saree: {
    src: U('photo-1616986491129-3e37cb654c82'),
    alt: 'Red and green embroidered saree fabric in a close editorial still-life',
  },
  lehenga: {
    src: U('photo-1756483510831-34a18c266b93'),
    alt: 'Peach lehenga skirt with embroidered jacket after dry clean and press',
  },
  blouse: {
    src: U('photo-1564257631407-4deb1f99d992'),
    alt: 'Blouse and choli after press service',
  },
  gown: {
    src: U('photo-1595777457583-95e059d581b8'),
    alt: 'Evening gown hung after dry cleaning',
  },
  skirt: {
    src: U('photo-1583496661160-fb5886a0aaaa'),
    alt: 'Skirt after professional laundry care',
  },
  dress: {
    src: U('photo-1595777457583-95e059d581b8'),
    alt: 'Full dress ready after dry clean and press',
  },
  top: {
    src: U('photo-1564257631407-4deb1f99d992'),
    alt: 'Top and kurti after laundry service',
  },
  dupatta: {
    src: U('photo-1616986491129-3e37cb654c82'),
    alt: 'Light embroidered dupatta fabric after gentle dry cleaning',
  },
  frock: {
    src: U('photo-1519238263530-99bdd11df2ea'),
    alt: 'Kids frock after wash and press',
  },
  purse: {
    src: U('photo-1584917865442-de89df76afd3'),
    alt: 'Handbag after professional cleaning',
  },
  bathrobe: {
    src: U('photo-1631049307264-da0ec9d70304'),
    alt: 'Soft bathrobe after laundry care',
  },
  girl_dress: {
    src: U('photo-1519238263530-99bdd11df2ea'),
    alt: 'Kids dress after wash and press',
  },
  sweater: {
    src: U('photo-1576566588028-4147f3842f27'),
    alt: 'Knit sweater folded after winter care',
  },
  overcoat: {
    src: U('photo-1551488831-00ddcb6c6bd3'),
    alt: 'Winter overcoats and jackets hung on an atelier rail',
  },
  overcoat_leather: {
    src: U('photo-1559551409-dadc959f76b8'),
    alt: 'Shearling leather overcoats hung after specialist dry cleaning',
  },
  jacket_denim: {
    src: U('photo-1611312449408-fcece27cdbb7'),
    alt: 'Indigo denim jacket on a hanger after dry clean and press',
  },
  jacket_puffer: {
    src: U('photo-1706765779494-2705542ebe74'),
    alt: 'Quilted white puffer jacket hanging after winter dry cleaning',
  },
  jacket_leather: {
    src: U('photo-1727515546577-f7d82a47b51d'),
    alt: 'Black leather jacket laid flat after specialist care',
  },
  hoodie: {
    src: U('photo-1556821840-3a63f95609a7'),
    alt: 'Hoodie after wash and press',
  },
  shawl: {
    src: U('photo-1616986491129-3e37cb654c82'),
    alt: 'Soft draped shawl fabric after gentle cleaning',
  },
  bedsheet: {
    src: U('photo-1540518614846-7eded433c457'),
    alt: 'Crisp white bedsheets and coverlet stacked on a freshly made bed',
  },
  blanket: {
    src: U('photo-1584100936595-c0654b55a3e2'),
    alt: 'Blanket folded after household laundry',
  },
  comforter: {
    src: U('photo-1584100936595-c0654b55a3e2'),
    alt: 'Comforter after professional cleaning',
  },
  pillow: {
    src: U('photo-1631049307264-da0ec9d70304'),
    alt: 'Pillow and cushion covers after wash',
  },
  shoes: {
    src: U('photo-1549298916-b41d501d3772'),
    alt: 'Clean sneakers staged on fabric after specialist shoe care',
  },
  heels: {
    src: U('photo-1543163521-1bf539c55dd2'),
    alt: 'Heels after professional cleaning',
  },
  bag: {
    src: U('photo-1553062407-98eeb64c6a62'),
    alt: 'Travel bag after cleaning service',
  },
  trolley: {
    src: U('photo-1565026057447-bc90a7dabb68'),
    alt: 'Trolley luggage after cleaning',
  },
  carpet: {
    src: U('photo-1600166898405-da9535204843'),
    alt: 'Carpet after household cleaning',
  },
  towel: {
    src: U('photo-1631889993959-41b4e9c6e3c5'),
    alt: 'Bath towels stacked after laundry',
  },
  toy: {
    src: U('photo-1558060370-d644479cb6f7'),
    alt: 'Soft toy after gentle cleaning',
  },
  gloves: {
    src: U('photo-1576566588028-4147f3842f27'),
    alt: 'Gloves after specialist cleaning',
  },
} as const satisfies Record<string, PricingCategoryImage>;

export type PricingProductPhotoKey = keyof typeof PRICING_PRODUCT_PHOTOS;

/** Ordered rules — first match wins. Prefer slug fragments (stable). */
const PRODUCT_PHOTO_RULES: ReadonlyArray<{
  key: PricingProductPhotoKey;
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

export function resolveProductPhotoKey(
  slug: string,
  name: string,
): PricingProductPhotoKey | null {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  for (const rule of PRODUCT_PHOTO_RULES) {
    if (rule.match(s, n)) return rule.key;
  }
  return null;
}

/**
 * Resolve the editorial frame for a price-tag product.
 * Unknown garments keep the category hero so the rack never blanks.
 */
export function resolvePricingProductImage(
  slug: string,
  name: string,
  category: CatalogCategory,
): PricingCategoryImage {
  const key = resolveProductPhotoKey(slug, name);
  if (key) return PRICING_PRODUCT_PHOTOS[key];
  return getPricingCategoryImage(category);
}
