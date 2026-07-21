import {
  WASHHOUSE_CATALOG_PHOTOS,
  WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

const P = WASHHOUSE_CATALOG_PHOTOS;
const S = WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS;

/** Service preview tile alt — garment/care context from catalog, prefixed when the photo is indirect. */
function servicePreviewAlt(title: string, photo: { alt: string }, contextual = false): string {
  return contextual ? `${title} — ${photo.alt}` : photo.alt;
}

export type ServicePreviewItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const SERVICE_PREVIEW_ITEMS: ServicePreviewItem[] = [
  {
    id: 'wash-fold',
    slug: 'wash-fold',
    title: 'Wash & Fold',
    description: 'Everyday clothes washed, dried, and neatly folded for your weekly load.',
    image: P.wash_fold.src,
    imageAlt: P.wash_fold.alt,
  },
  {
    id: 'wash-iron',
    slug: 'wash-iron',
    title: 'Wash & Iron',
    description: 'Freshly washed garments pressed and ready to wear straight from the bag.',
    image: P.wash_iron.src,
    imageAlt: P.wash_iron.alt,
  },
  {
    id: 'premium-laundry',
    slug: 'premium-laundry',
    title: 'Premium Laundry',
    description: 'Extra-care handling for delicate fabrics and designer pieces.',
    image: P.lehenga.src,
    imageAlt: servicePreviewAlt('Premium laundry', P.lehenga, true),
  },
  {
    id: 'dry-clean',
    slug: 'dry-clean',
    title: 'Dry Cleaning',
    description: 'Specialist solvent cleaning for suits, sarees, and formal wear.',
    image: P.suit.src,
    imageAlt: P.suit.alt,
  },
  {
    id: 'shoe-cleaning',
    slug: 'shoe-cleaning',
    title: 'Shoe Cleaning',
    description: 'Deep clean, deodorise, and restore sneakers and leather pairs.',
    image: P.shoes.src,
    imageAlt: P.shoes.alt,
  },
  {
    id: 'curtain-cleaning',
    slug: 'curtain-cleaning',
    title: 'Curtain Cleaning',
    description: 'Dust-free, fresh curtains returned ready to rehang at home.',
    image: S.curtain.src,
    imageAlt: S.curtain.alt,
  },
  {
    id: 'more-services',
    slug: 'more-services',
    title: 'More Services',
    description: 'Steam press, express turnaround, and monthly plans from partner stores.',
    image: P.hoodie.src,
    imageAlt: servicePreviewAlt('More services', P.hoodie, true),
  },
];
