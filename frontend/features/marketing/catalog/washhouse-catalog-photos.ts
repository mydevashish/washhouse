import type { CatalogCategory } from '@/features/laundry-price-list/types';
import type { CatalogPhotoKey } from '@/features/marketing/catalog/resolve-catalog-photo-key';
import { resolveCatalogPhotoKey } from '@/features/marketing/catalog/resolve-catalog-photo-key';
import {
  MARKETING_DECORATIVE_BANNERS,
  MARKETING_HERO_IMAGES,
  MARKETING_HERO_SLIDE_OVERLAYS,
} from '@/features/marketing/catalog/marketing-hero-images';

export type WashhouseCatalogPhoto = {
  src: string;
  alt: string;
};

/** Full-bleed photo behind marketing copy — decorative only (`alt=""` + `aria-hidden`). */
export type WashhouseDecorativeBanner = {
  photo: WashhouseCatalogPhoto;
  /** Scrim keeping foreground / text-on-hero WCAG AA over the photo (light + dark). */
  overlayClassName: string;
};

/**
 * Canonical Phase 0 WebP tile per pricing photo key.
 * Paths mirror `public/catalog/{category}/{file}.webp` from manifest.json.
 */
const CATALOG_TILE_BY_KEY: Record<CatalogPhotoKey, `${string}/${string}`> = {
  wash_fold: 'services/wash-fold',
  wash_iron: 'services/wash-iron',
  premium_laundry: 'services/premium-laundry',
  dry_clean: 'services/dry-clean',
  shoe_cleaning: 'services/shoe-cleaning',
  curtain_cleaning: 'services/curtain-cleaning',
  more_services: 'services/more-services',
  sherwani_cotton: 'men/sherwani-cotton',
  sherwani_wedding: 'men/sherwani-wedding',
  lehenga_normal: 'women/lehenga-normal',
  lehenga_heavy: 'women/lehenga-heavy',
  saree_normal: 'women/saree-normal',
  saree_heavy: 'women/saree-heavy',
  suit: 'men/suits',
  suit_2pcs: 'men/suit-2pcs',
  suit_3pcs: 'men/suit-3pcs',
  jacket_leather: 'winter/jacket-leather',
  shoes: 'accessories/shoes',
  blanket: 'household/blanket',
  toy: 'accessories/toy',
  shoes_bag: 'accessories/shoes-bag',
  membership: 'services/membership',

  shirt: 'men/shirt',
  trouser: 'men/trouser',
  shorts: 'men/shorts',
  lower: 'men/lower',
  jogger: 'men/jogger',
  kurta_m: 'men/kurta-m',
  dhoti: 'men/dhoti',  
  coat_formal: 'men/coat-formal', 
  coat_heavy: 'men/coat-heavy',  
  vest: 'men/vest',
  waistcoat: 'men/waistcoat',
  tie: 'men/tie',
  cap_fabric: 'men/cap-fabric',
  cap_leather: 'men/cap-leather',
  turban: 'men/turban',
  wallet: 'men/wallet',
  hanky: 'men/hanky',
  blouse_choli_normal: 'women/blouse-choli-normal',
  blouse_choli_heavy: 'women/blouse-choli-heavy',
  gown: 'women/gown',
  kurta_w: 'women/kurta-w',
  salwar: 'women/salwar-suit',
  skirt_short: 'women/skirt-short',
  skirt_long: 'women/skirt-long',
  dress_normal: 'women/full-dress-normal',
  dress_party: 'women/full-dress-party',
  top: 'women/top-kurti',
  dupatta: 'women/dupatta',
  frock_normal: 'women/frock-normal',
  frock_heavy: 'women/frock-heavy',
  petticoat: 'women/petticoat',
  kameez_normal: 'women/kameez-normal',
  kameez_fancy: 'women/kameez-fancy',
  burkha: 'women/burkha',
  purse_small: 'women/purse-small',
  purse_medium: 'women/purse-medium',
  purse_large: 'women/purse-large',
  bathrobe: 'women/bathrobe',
  girl_dress: 'kids/girl-dress',
  girl_dupatta: 'kids/girl-dupatta',
  girl_frock: 'kids/girl-frock',
  kids_full_jacket_leather: 'kids/kids-full-jacket-leather',
  kids_full_jacket_normal: 'kids/kids-full-jacket-normal',
  kids_half_jacket_leather: 'kids/kids-half-jacket-leather',
  kids_half_jacket_normal: 'kids/kids-half-jacket-normal',
  sweater_kids: 'winter/sweater-kids',
  sweater_men_women: 'winter/sweater',
  overcoat_kids: 'winter/overcoat-kids',
  overcoat: 'winter/overcoat-men-women',
  overcoat_leather: 'winter/overcoat-leather',
  jacket_denim: 'winter/jacket-cotton-denim',
  jacket_puffer: 'winter/jacket-puffer',
  
  hoodie: 'winter/hoodie',
  shawl: 'winter/shawl',
  bedsheet: 'household/bedsheet',
  
  comforter: 'household/comforter',
  pillow: 'household/pillow-cover',
  
  heels: 'accessories/heels',
  bag: 'accessories/backpack',
  trolley: 'accessories/trolley-m',
  carpet: 'household/carpet',
  towel: 'household/towel',
  
  gloves: 'accessories/gloves-cotton',
};

/** Accessible labels for each catalog tile (garment + care context). */
const CATALOG_PHOTO_ALTS: Record<CatalogPhotoKey, string> = {
  wash_fold: 'Neatly folded everyday laundry stacks after wash and fold',
  wash_iron: 'Freshly pressed shirts stacked after wash and iron',
  premium_laundry: 'Extra-care handling for delicate fabrics and designer pieces',
  dry_clean: 'Specialist solvent cleaning for suits, sarees, and formal wear',
  shoe_cleaning: 'Deep clean, deodorise, and restore sneakers and leather pairs',
  curtain_cleaning: 'Dust-free, fresh curtains returned ready to rehang at home',
  more_services: 'Steam press, express turnaround, and monthly plans from partner stores',
  shirt: "Pressed men's dress shirts on hangers after wash and iron",
  trouser: "Men's folded trousers and jeans ready after laundry care",
  shorts: "Men's casual shorts folded after wash and fold",
  lower: "Men's soft lounge lowers folded after gentle wash",
  jogger: "Men's joggers and cargo pants after professional laundry care",
  kurta_m: "Men's cotton kurta hung after dry cleaning and press",
  dhoti: "Men's cotton dhoti draped after traditional laundry care",
  sherwani_cotton: "Men's formal sherwani ready after wedding dry clean and press",
  sherwani_wedding: "Men's formal sherwani ready after wedding dry clean and press",
  coat_formal: "Men's tailored formal coat hung after dry cleaning",
  coat_heavy: "Men's tailored heavy coat hung after dry cleaning",
  kurta_w: "Women's cotton kurta hung after dry cleaning and press",
  suit: "Men's formal suit on a hanger after dry cleaning and press",
  suit_2pcs: "Men's formal suit on a hanger after dry cleaning and press",
  suit_3pcs: "Men's formal suit on a hanger after dry cleaning and press",
  vest: "Men's waistcoat after steam press service",
  waistcoat: "Men's waistcoat after steam press service",
  tie: "Men's silk ties arranged after dry cleaning",
  cap_fabric: "Men's fabric cap after professional cleaning",
  cap_leather: "Men's leather cap after professional cleaning",
  turban: "turban",
  wallet: "Men's leather wallet after careful dry cleaning",
  hanky: 'Fresh cotton handkerchiefs after laundry care',
  saree_normal: "Women's embroidered saree after gentle dry cleaning and press",
  saree_heavy: "Women's embroidered saree after gentle dry cleaning and press",
  kameez_normal: "kameez",
  kameez_fancy: "kameez",
  burkha: "burkha",
  salwar: "salwar",
  lehenga_normal: "Women's lehenga skirt and jacket after dry clean and press",
  lehenga_heavy: "Women's lehenga skirt and jacket after dry clean and press",
  blouse_choli_normal: "Women's blouse and choli after press service",
  blouse_choli_heavy: "Women's blouse and choli after press service",
  gown: "Women's evening gown hung after dry cleaning",
  skirt_short: "Women's skirt after professional laundry care",
  skirt_long: "Women's skirt after professional laundry care",
  dress_normal: "Women's full dress ready after dry clean and press",
  dress_party: "Women's full dress ready after dry clean and press",
  top: "Women's kurti and top after laundry service",
  dupatta: "Women's light dupatta after gentle dry cleaning",
  frock_normal: "Girls' frock after wash and press",
  frock_heavy: "Girls' frock after wash and press",
  petticoat: "Girls' frock after wash and press",
  purse_small: "Women's handbag after professional cleaning",
  purse_medium: "Women's handbag after professional cleaning",
  purse_large: "Women's handbag after professional cleaning",
  bathrobe: "Women's soft bathrobe after laundry care",
  girl_dress: "Girls' dress after wash and press",
  girl_dupatta: "dupatta",
  girl_frock: "frock",
  kids_full_jacket_leather: "full jacket",
  kids_full_jacket_normal: "full jacket",
  kids_half_jacket_leather: "half jacket",
  kids_half_jacket_normal: "half jacket",
  sweater_kids: 'Knit sweater folded after winter garment care',
  sweater_men_women: 'Knit sweater folded after winter garment care',
  overcoat_kids: 'Winter overcoats on hangers after specialist dry cleaning',
  overcoat: 'Winter overcoats on hangers after specialist dry cleaning',
  overcoat_leather: 'Leather overcoats hung after specialist dry cleaning',
  jacket_denim: 'Cotton denim jacket on a hanger after dry clean and press',
  jacket_puffer: 'Quilted puffer jacket hanging after winter dry cleaning',
  jacket_leather: 'Leather jacket laid flat after specialist leather care',
  hoodie: 'Hooded sweatshirt after wash and press',
  shawl: 'Soft wool shawl after gentle dry cleaning',
  bedsheet: 'Crisp white bedsheets stacked after household laundry',
  blanket: 'Folded blanket after household laundry care',
  comforter: 'Comforter after professional cleaning and fluffing',
  pillow: 'Pillow and cushion covers after wash',
  shoes: 'Sneakers staged after specialist shoe cleaning and deodorizing',
  shoes_bag: 'Clean, deodorise, and refresh your favourite pairs and bags',
  heels: "Women's heels after professional cleaning",
  bag: 'Travel backpack after cleaning service',
  trolley: 'Trolley luggage after professional cleaning',
  carpet: 'Area carpet after household deep cleaning',
  towel: 'Bath towels stacked after laundry',
  toy: "Children's soft toy after gentle cleaning",
  gloves: 'Gloves after specialist cleaning',
  membership: 'Lock in a monthly pickup plan with recurring billing',
};

function catalogPhotoSrc(relativePath: `${string}/${string}`): string {
  return `/catalog/${relativePath}.webp`;
}

function buildCatalogPhotos(): Record<CatalogPhotoKey, WashhouseCatalogPhoto> {
  const photos = {} as Record<CatalogPhotoKey, WashhouseCatalogPhoto>;
  for (const key of Object.keys(CATALOG_TILE_BY_KEY) as CatalogPhotoKey[]) {
    photos[key] = {
      src: catalogPhotoSrc(CATALOG_TILE_BY_KEY[key]),
      alt: CATALOG_PHOTO_ALTS[key],
    };
  }
  return photos;
}

/** On-brand catalog WebP tiles keyed like `PRICING_PRODUCT_PHOTOS`. */
export const WASHHOUSE_CATALOG_PHOTOS: Record<CatalogPhotoKey, WashhouseCatalogPhoto> =
  buildCatalogPhotos();

/** Manifest tiles without a pricing product photo key (catalog-only). */
export const WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS = {
  curtain: {
    src: catalogPhotoSrc('household/curtain'),
    alt: 'Floor-length curtain panel after household dry cleaning service',
  },
  pickup_delivery: {
    src: catalogPhotoSrc('services/pickup-delivery'),
    alt: 'WashHouse doorstep pickup and delivery with folded laundry bags',
  },
  on_time_delivery: {
    src: catalogPhotoSrc('services/on-time-delivery'),
    alt: 'On-time laundry delivery with pressed garments ready for pickup',
  },
  professional_cleaning: {
    src: catalogPhotoSrc('services/professional-cleaning'),
    alt: 'Commercial washers in a professional laundry facility after quality cleaning',
  },
  steam_ironing: {
    src: catalogPhotoSrc('services/steam-ironing'),
    alt: 'Garment on a steam press board during professional ironing service',
  },
} as const satisfies Record<string, WashhouseCatalogPhoto>;

/** Best representative tile per price-guide category. */
export const WASHHOUSE_CATALOG_CATEGORY_HEROES: Record<
  CatalogCategory,
  WashhouseCatalogPhoto
> = {
  laundry_by_kg: WASHHOUSE_CATALOG_PHOTOS.wash_fold,
  men: WASHHOUSE_CATALOG_PHOTOS.shirt,
  women: WASHHOUSE_CATALOG_PHOTOS.saree_normal,
  kids: WASHHOUSE_CATALOG_PHOTOS.girl_dress,
  winter: WASHHOUSE_CATALOG_PHOTOS.jacket_puffer,
  household: WASHHOUSE_CATALOG_PHOTOS.bedsheet,
};

export function getWashhouseCatalogPhoto(
  key: string,
): WashhouseCatalogPhoto | undefined {
  return WASHHOUSE_CATALOG_PHOTOS[key as CatalogPhotoKey];
}

export function resolveWashhouseCatalogPhoto(
  slug: string,
  name: string,
): WashhouseCatalogPhoto | undefined {
  const key = resolveCatalogPhotoKey(slug, name);
  if (!key) return undefined;
  return WASHHOUSE_CATALOG_PHOTOS[key];
}

/** @deprecated Use `MARKETING_HERO_IMAGES` from `marketing-hero-images.ts` */
export const WASHHOUSE_HERO_IMAGES = MARKETING_HERO_IMAGES;

/** @deprecated Use `MARKETING_DECORATIVE_BANNERS` from `marketing-hero-images.ts` */
export const WASHHOUSE_DECORATIVE_BANNERS = MARKETING_DECORATIVE_BANNERS;

/** @deprecated Use `MARKETING_HERO_SLIDE_OVERLAYS` from `marketing-hero-images.ts` */
export const WASHHOUSE_HERO_SLIDE_OVERLAYS = MARKETING_HERO_SLIDE_OVERLAYS;
