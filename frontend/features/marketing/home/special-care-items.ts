import {
  WASHHOUSE_CATALOG_PHOTOS,
  WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS,
  type WashhouseCatalogPhoto,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

/** Special-care tile alt — label + garment/care context without repeating visible text verbatim. */
function specialCareAlt(label: string, photo: WashhouseCatalogPhoto): string {
  return `${label} specialist care — ${photo.alt}`;
}

export type SpecialCareItem = {
  id: string;
  slug: string;
  label: string;
  image: string;
  imageAlt: string;
};

const P = WASHHOUSE_CATALOG_PHOTOS;
const S = WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS;

export const SPECIAL_CARE_ITEMS: SpecialCareItem[] = [
  {
    id: 'wedding-sherwani',
    slug: 'wedding-sherwani',
    label: 'Wedding / Sherwani',
    image: P.sherwani_wedding.src,
    imageAlt: specialCareAlt('Wedding / Sherwani', P.sherwani_wedding),
  },
  {
    id: 'lehengas',
    slug: 'lehengas',
    label: 'Lehengas',
    image: P.lehenga_heavy.src,
    imageAlt: specialCareAlt('Lehengas', P.lehenga_heavy),
  },
  {
    id: 'sarees',
    slug: 'sarees',
    label: 'Sarees',
    image: P.saree_heavy.src,
    imageAlt: specialCareAlt('Sarees', P.saree_heavy),
  },
  {
    id: 'suits',
    slug: 'suits',
    label: 'Suits',
    image: P.suit.src,
    imageAlt: specialCareAlt('Suits', P.suit),
  },
  {
    id: 'leather-jackets',
    slug: 'leather-jackets',
    label: 'Leather Jackets',
    image: P.jacket_leather.src,
    imageAlt: specialCareAlt('Leather Jackets', P.jacket_leather),
  },
  {
    id: 'shoes',
    slug: 'shoes',
    label: 'Shoes',
    image: P.shoes.src,
    imageAlt: specialCareAlt('Shoes', P.shoes),
  },
  {
    id: 'curtains',
    slug: 'curtains',
    label: 'Curtains',
    image: S.curtain.src,
    imageAlt: specialCareAlt('Curtains', S.curtain),
  },
  {
    id: 'blankets',
    slug: 'blankets',
    label: 'Blankets',
    image: P.blanket_king.src,
    imageAlt: specialCareAlt('Blankets', P.blanket_king),
  },
  {
    id: 'soft-toys',
    slug: 'soft-toys',
    label: 'Soft Toys',
    image: P.toy_large.src,
    imageAlt: specialCareAlt('Soft Toys', P.toy_large),
  },
];
