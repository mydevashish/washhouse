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
  shirt: 'men/shirt',
  trouser: 'men/trouser',
  shorts: 'men/shorts',
  lower: 'men/lower',
  jogger: 'men/jogger',
  kurta: 'men/kurta',
  dhoti: 'men/dhoti',
  sherwani: 'men/sherwani-cotton',
  coat: 'men/coat-formal',
  suit: 'men/suit-2pcs',
  vest: 'men/vest',
  tie: 'men/tie',
  cap: 'men/cap-fabric',
  wallet: 'men/wallet',
  hanky: 'men/hanky',
  saree: 'women/saree-normal',
  lehenga: 'women/lehenga-normal',
  blouse: 'women/blouse-choli',
  gown: 'women/gown',
  skirt: 'women/skirt-short',
  dress: 'women/full-dress-normal',
  top: 'women/top-kurti',
  dupatta: 'women/dupatta',
  frock: 'women/frock-normal',
  purse: 'accessories/handbag',
  bathrobe: 'women/bathrobe',
  girl_dress: 'kids/girl-dress',
  sweater: 'winter/sweater',
  overcoat: 'winter/overcoat-men-women',
  overcoat_leather: 'winter/overcoat-leather',
  jacket_denim: 'winter/jacket-cotton-denim',
  jacket_puffer: 'winter/jacket-puffer',
  jacket_leather: 'winter/jacket-leather',
  hoodie: 'winter/hoodie',
  shawl: 'winter/shawl',
  bedsheet: 'household/bedsheet',
  blanket: 'household/blanket',
  comforter: 'household/comforter',
  pillow: 'household/pillow',
  shoes: 'accessories/shoes',
  heels: 'accessories/heels',
  bag: 'accessories/backpack',
  trolley: 'accessories/trolley-s',
  carpet: 'household/carpet',
  towel: 'household/towel',
  toy: 'accessories/toy',
  gloves: 'accessories/gloves-cotton',
};

/** Accessible labels for each catalog tile (garment + care context). */
const CATALOG_PHOTO_ALTS: Record<CatalogPhotoKey, string> = {
  wash_fold: 'Neatly folded everyday laundry stacks after wash and fold',
  wash_iron: 'Freshly pressed shirts stacked after wash and iron',
  shirt: "Pressed men's dress shirts on hangers after wash and iron",
  trouser: "Men's folded trousers and jeans ready after laundry care",
  shorts: "Men's casual shorts folded after wash and fold",
  lower: "Men's soft lounge lowers folded after gentle wash",
  jogger: "Men's joggers and cargo pants after professional laundry care",
  kurta: "Men's cotton kurta hung after dry cleaning and press",
  dhoti: "Men's cotton dhoti draped after traditional laundry care",
  sherwani: "Men's formal sherwani ready after wedding dry clean and press",
  coat: "Men's tailored formal coat hung after dry cleaning",
  suit: "Men's formal suit on a hanger after dry cleaning and press",
  vest: "Men's waistcoat after steam press service",
  tie: "Men's silk ties arranged after dry cleaning",
  cap: "Men's fabric cap after professional cleaning",
  wallet: "Men's leather wallet after careful dry cleaning",
  hanky: 'Fresh cotton handkerchiefs after laundry care',
  saree: "Women's embroidered saree after gentle dry cleaning and press",
  lehenga: "Women's lehenga skirt and jacket after dry clean and press",
  blouse: "Women's blouse and choli after press service",
  gown: "Women's evening gown hung after dry cleaning",
  skirt: "Women's skirt after professional laundry care",
  dress: "Women's full dress ready after dry clean and press",
  top: "Women's kurti and top after laundry service",
  dupatta: "Women's light dupatta after gentle dry cleaning",
  frock: "Girls' frock after wash and press",
  purse: "Women's handbag after professional cleaning",
  bathrobe: "Women's soft bathrobe after laundry care",
  girl_dress: "Girls' dress after wash and press",
  sweater: 'Knit sweater folded after winter garment care',
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
  heels: "Women's heels after professional cleaning",
  bag: 'Travel backpack after cleaning service',
  trolley: 'Trolley luggage after professional cleaning',
  carpet: 'Area carpet after household deep cleaning',
  towel: 'Bath towels stacked after laundry',
  toy: "Children's soft toy after gentle cleaning",
  gloves: 'Gloves after specialist cleaning',
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
  women: WASHHOUSE_CATALOG_PHOTOS.saree,
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
