const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
    image: U('photo-1558618666-fcd25c85cd64', 640),
    imageAlt: 'Neatly folded everyday laundry fresh from the wash',
  },
  {
    id: 'wash-iron',
    slug: 'wash-iron',
    title: 'Wash & Iron',
    description: 'Freshly washed garments pressed and ready to wear straight from the bag.',
    image: U('photo-1571902943202-507ec2618e8f', 640),
    imageAlt: 'Clothes being ironed to a crisp finish',
  },
  {
    id: 'premium-laundry',
    slug: 'premium-laundry',
    title: 'Premium Laundry',
    description: 'Extra-care handling for delicate fabrics and designer pieces.',
    image: U('photo-1600880292203-757bb62b4baf', 640),
    imageAlt: 'Delicate garments handled with premium laundry care',
  },
  {
    id: 'dry-clean',
    slug: 'dry-clean',
    title: 'Dry Cleaning',
    description: 'Specialist solvent cleaning for suits, sarees, and formal wear.',
    image: U('photo-1517677208171-0bc6725a3e60', 640),
    imageAlt: 'Laundry service vehicle ready for doorstep pickup',
  },
  {
    id: 'shoe-cleaning',
    slug: 'shoe-cleaning',
    title: 'Shoe Cleaning',
    description: 'Deep clean, deodorise, and restore sneakers and leather pairs.',
    image: U('photo-1542291026-7eec264c27ff', 640),
    imageAlt: 'Pair of clean sneakers after professional shoe care',
  },
  {
    id: 'curtain-cleaning',
    slug: 'curtain-cleaning',
    title: 'Curtain Cleaning',
    description: 'Dust-free, fresh curtains returned ready to rehang at home.',
    image: U('photo-1586023492125-27b2c045efd7', 640),
    imageAlt: 'Light-filled room with freshly cleaned curtains',
  },
  {
    id: 'more-services',
    slug: 'more-services',
    title: 'More Services',
    description: 'Steam press, express turnaround, and monthly plans from partner stores.',
    image: U('photo-1512941937669-90a1b58e7e9c', 640),
    imageAlt: 'Laundry bags ready for pickup and delivery',
  },
];
