import {
  BadgeCheck,
  Clock,
  ShieldCheck,
  Store,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { HERO_SLIDE_IMAGES } from '@/features/discover/marketplace/laundry-images';
import { FRANCHISE_BROCHURE_PDF_HREF } from '@/features/marketing/franchise/franchise-constants';

const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export type HeroTrustItem = {
  label: string;
  icon: LucideIcon;
};

export type HeroFranchiseBenefit = {
  label: string;
  icon: LucideIcon;
};

type HeroSlideBase = {
  id: string;
  headline: string;
  image: string;
  imageAlt: string;
  overlayClassName: string;
};

export type HeroWelcomeSlide = HeroSlideBase & {
  variant: 'welcome';
  pills: readonly string[];
  trustItems: readonly HeroTrustItem[];
  promo: { badge: string; code: string };
};

export type HeroServicesSlide = HeroSlideBase & {
  variant: 'services';
  subcopy?: string;
  services: readonly string[];
};

export type HeroFranchiseSlide = HeroSlideBase & {
  variant: 'franchise';
  subcopy: string;
  benefits: readonly HeroFranchiseBenefit[];
  applyHref: string;
  brochureHref: string;
};

export type HeroDeliverySlide = HeroSlideBase & {
  variant: 'delivery';
  subcopy: string;
  phoneImage?: string;
  phoneImageAlt?: string;
};

export type HeroSlide =
  | HeroWelcomeSlide
  | HeroServicesSlide
  | HeroFranchiseSlide
  | HeroDeliverySlide;

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'welcome',
    variant: 'welcome',
    headline: 'CLEAN CLOTHES. HAPPY LIFE.',
    pills: ['Free Pickup', 'Express', 'Premium Care'],
    trustItems: [
      { label: 'Verified laundries', icon: BadgeCheck },
      { label: 'Free doorstep pickup', icon: Truck },
      { label: 'Express turnaround', icon: Clock },
      { label: 'Quality guaranteed', icon: ShieldCheck },
    ],
    promo: { badge: '20% OFF', code: 'WELCOME20' },
    image: HERO_SLIDE_IMAGES.primary,
    imageAlt: 'Freshly folded laundry ready for delivery',
    overlayClassName:
      'bg-gradient-to-br from-brand-500/20 via-transparent to-sky-500/15 dark:from-brand-900/30 dark:to-sky-500/10',
  },
  {
    id: 'fabrics',
    variant: 'services',
    headline: 'EXPERT CARE FOR EVERY FABRIC',
    subcopy: 'Specialist handling for everyday wear, formals, and delicate garments.',
    services: [
      'Wash & Fold',
      'Dry Cleaning',
      'Iron & Press',
      'Express',
      'Steam Press',
      'Shoe Care',
    ],
    image: HERO_SLIDE_IMAGES.compare,
    imageAlt: 'Professional laundry facility with modern equipment',
    overlayClassName:
      'bg-gradient-to-tr from-sky-500/15 via-transparent to-brand-500/20 dark:from-sky-500/10 dark:to-brand-600/25',
  },
  {
    id: 'franchise',
    variant: 'franchise',
    headline: 'START YOUR OWN LAUNDRY BUSINESS',
    subcopy:
      'Join The WashHouse partner network — we bring customers, you deliver fresh clothes.',
    benefits: [
      { label: 'Your storefront online', icon: Store },
      { label: 'More orders', icon: Users },
      { label: 'Growth dashboard', icon: TrendingUp },
    ],
    applyHref: '/franchise#apply',
    brochureHref: FRANCHISE_BROCHURE_PDF_HREF,
    image: HERO_SLIDE_IMAGES.partner,
    imageAlt: 'Laundry business owner reviewing orders on a tablet',
    overlayClassName:
      'bg-gradient-to-bl from-brand-900/20 via-transparent to-brand-500/15 dark:from-brand-900/35 dark:to-brand-600/20',
  },
  {
    id: 'delivery',
    variant: 'delivery',
    headline: 'WE PICK. WE CLEAN. WE DELIVER.',
    subcopy:
      'Schedule a pickup from home or office — track your order and get clothes back at your door.',
    image: HERO_SLIDE_IMAGES.doorstep,
    imageAlt: 'Delivery van with laundry bags ready for doorstep service',
    phoneImage: U('photo-1512941937669-90a1b58e7e9c', 600),
    phoneImageAlt: 'Mobile phone showing laundry order tracking',
    overlayClassName:
      'bg-gradient-to-r from-brand-500/15 via-transparent to-sky-500/20 dark:from-brand-600/20 dark:to-sky-500/15',
  },
] as const;

export const WHATSAPP_BOOKING_MESSAGE =
  'Hi WashHouse — I would like to book a laundry pickup.';
