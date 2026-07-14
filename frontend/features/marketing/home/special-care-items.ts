const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export type SpecialCareItem = {
  id: string;
  slug: string;
  label: string;
  image: string;
  imageAlt: string;
};

export const SPECIAL_CARE_ITEMS: SpecialCareItem[] = [
  {
    id: 'wedding-dresses',
    slug: 'wedding-dresses',
    label: 'Wedding Dresses',
    image: U('photo-1519741497674-611481863552', 400),
    imageAlt: 'Elegant white wedding dress on display',
  },
  {
    id: 'lehengas',
    slug: 'lehengas',
    label: 'Lehengas',
    image: U('photo-1583391733981-5e38d4dcc9b5', 400),
    imageAlt: 'Colourful embroidered lehenga with intricate detailing',
  },
  {
    id: 'sarees',
    slug: 'sarees',
    label: 'Sarees',
    image: U('photo-1610030458120-9cb80a4b8744', 400),
    imageAlt: 'Silk saree draped with rich fabric texture',
  },
  {
    id: 'suits',
    slug: 'suits',
    label: 'Suits',
    image: U('photo-1594938298603-c8148c4dae35', 400),
    imageAlt: 'Tailored formal suit on a hanger',
  },
  {
    id: 'leather-jackets',
    slug: 'leather-jackets',
    label: 'Leather Jackets',
    image: U('photo-1551028719-00167b16eac5', 400),
    imageAlt: 'Classic brown leather jacket',
  },
  {
    id: 'shoes',
    slug: 'shoes',
    label: 'Shoes',
    image: U('photo-1542291026-7eec264c27ff', 400),
    imageAlt: 'Pair of clean sneakers after professional care',
  },
  {
    id: 'curtains',
    slug: 'curtains',
    label: 'Curtains',
    image: U('photo-1586023492125-27b2c045efd7', 400),
    imageAlt: 'Light-filled room with freshly cleaned curtains',
  },
  {
    id: 'blankets',
    slug: 'blankets',
    label: 'Blankets',
    image: U('photo-1631889992177-49c4a3be4bfa', 400),
    imageAlt: 'Soft folded blankets stacked neatly',
  },
  {
    id: 'soft-toys',
    slug: 'soft-toys',
    label: 'Soft Toys',
    image: U('photo-1530325243097-094c3a6efa94', 400),
    imageAlt: 'Plush soft toys ready for gentle cleaning',
  },
];
