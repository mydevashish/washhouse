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

import { WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS } from '@/features/marketing/catalog/washhouse-catalog-photos';
import {
  MARKETING_HERO_IMAGES,
  MARKETING_HERO_SLIDE_OVERLAYS,
} from '@/features/marketing/catalog/marketing-hero-images';
import { FRANCHISE_BROCHURE_PDF_HREF } from '@/features/marketing/franchise/franchise-constants';

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
    image: MARKETING_HERO_IMAGES.welcome.src,
    imageAlt: MARKETING_HERO_IMAGES.welcome.alt,
    overlayClassName: MARKETING_HERO_SLIDE_OVERLAYS.welcome,
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
    image: MARKETING_HERO_IMAGES.services.src,
    imageAlt: MARKETING_HERO_IMAGES.services.alt,
    overlayClassName: MARKETING_HERO_SLIDE_OVERLAYS.fabrics,
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
    image: MARKETING_HERO_IMAGES.franchise.src,
    imageAlt: MARKETING_HERO_IMAGES.franchise.alt,
    overlayClassName: MARKETING_HERO_SLIDE_OVERLAYS.franchise,
  },
  {
    id: 'delivery',
    variant: 'delivery',
    headline: 'WE PICK. WE CLEAN. WE DELIVER.',
    subcopy:
      'Schedule a pickup from home or office — track your order and get clothes back at your door.',
    image: MARKETING_HERO_IMAGES.delivery.src,
    imageAlt: MARKETING_HERO_IMAGES.delivery.alt,
    phoneImage: WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.on_time_delivery.src,
    phoneImageAlt: WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS.on_time_delivery.alt,
    overlayClassName: MARKETING_HERO_SLIDE_OVERLAYS.delivery,
  },
] as const;

export const WHATSAPP_BOOKING_MESSAGE =
  'Hi WashHouse — I would like to book a laundry pickup.';
