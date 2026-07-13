import {
  Droplets,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Timer,
  Wind,
  type LucideIcon,
} from 'lucide-react';

export type ServicePreviewItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  /** Indicative starting price shown on homepage cards */
  priceFrom?: string;
};

export const SERVICE_PREVIEW_ITEMS: ServicePreviewItem[] = [
  {
    id: 'wash-fold',
    title: 'Wash & Fold',
    description: 'Everyday clothes washed, dried, and neatly folded — perfect for weekly laundry.',
    icon: ShoppingBasket,
    accent: 'bg-primary/10 text-primary',
    priceFrom: '₹49/kg',
  },
  {
    id: 'dry-clean',
    title: 'Dry Cleaning',
    description: 'Premium care for suits, sarees, and delicate fabrics that need specialist handling.',
    icon: Shirt,
    accent: 'bg-info-muted text-info',
    priceFrom: '₹120/piece',
  },
  {
    id: 'iron',
    title: 'Iron & Press',
    description: 'Crisp, wrinkle-free finishes for office wear and formal outfits.',
    icon: Sparkles,
    accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    priceFrom: '₹15/piece',
  },
  {
    id: 'express',
    title: 'Express',
    description: 'Same-day or next-day turnaround when you are on a tight schedule.',
    icon: Timer,
    accent: 'bg-warning-muted text-warning',
    priceFrom: '₹79/kg',
  },
  {
    id: 'steam',
    title: 'Steam Press',
    description: 'Gentle steam for silks, blazers, and garments that need a polished finish.',
    icon: Wind,
    accent: 'bg-success-muted text-success',
    priceFrom: '₹15/piece',
  },
  {
    id: 'shoe-care',
    title: 'Shoe Care',
    description: 'Clean, deodorise, and refresh your favourite pairs — ready to step out.',
    icon: Droplets,
    accent: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    priceFrom: '₹199/pair',
  },
];
