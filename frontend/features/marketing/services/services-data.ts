import {
  CalendarDays,
  Footprints,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react';

import {
  WASHHOUSE_CATALOG_PHOTOS,
  WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

const P = WASHHOUSE_CATALOG_PHOTOS;
const S = WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS;

/** Service card alt when the tile photo is representative but not a 1:1 match to the title. */
function serviceCategoryAlt(title: string, photo: { alt: string }, contextual = false): string {
  return contextual ? `${title} — ${photo.alt}` : photo.alt;
}

export type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  turnaround: string;
  priceFrom: string;
  image?: string;
  imageAlt?: string;
  ctaHref?: string;
  ctaLabel?: string;
  optional?: boolean;
};

export type ServicesFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'wash-fold',
    title: 'Wash & Fold',
    description:
      'Everyday clothes washed, dried, and neatly folded — perfect for your weekly laundry load.',
    icon: ShoppingBasket,
    accent: 'bg-primary/10 text-primary',
    turnaround: '24–48 hours',
    priceFrom: 'from ₹79/kg',
    image: P.wash_fold.src,
    imageAlt: P.wash_fold.alt,
  },
  {
    id: 'dry-clean',
    title: 'Dry Cleaning',
    description:
      'Specialist solvent cleaning for suits, sarees, blazers, and delicate fabrics that need extra care.',
    icon: Shirt,
    accent: 'bg-info-muted text-info',
    turnaround: '2–4 days',
    priceFrom: 'from ₹69/piece',
    image: P.suit.src,
    imageAlt: P.suit.alt,
  },
  {
    id: 'steam-iron',
    title: 'Steam Iron / Press',
    description:
      'Crisp, wrinkle-free finishes for office wear, formals, and garments that need a polished look.',
    icon: Sparkles,
    accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    turnaround: '24–48 hours',
    priceFrom: 'from ₹15/piece',
    image: P.wash_iron.src,
    imageAlt: P.wash_iron.alt,
  },
  {
    id: 'shoe-bag-care',
    title: 'Shoe & bag care',
    description:
      'Clean, deodorise, and refresh your favourite pairs and bags — optional at select partner stores.',
    icon: Footprints,
    accent: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    turnaround: '2–3 days',
    priceFrom: 'from ₹249/pair',
    optional: true,
    image: P.shoes.src,
    imageAlt: P.shoes.alt,
  },
  {
    id: 'express',
    title: 'Express / same-day',
    description:
      'Same-day or next-day turnaround when you are on a tight schedule — available at participating laundries.',
    icon: Timer,
    accent: 'bg-warning-muted text-warning',
    turnaround: 'Same day – 24 hrs',
    priceFrom: 'from ₹79/kg',
    image: S.on_time_delivery.src,
    imageAlt: serviceCategoryAlt('Express / same-day', S.on_time_delivery, true),
  },
  {
    id: 'subscription',
    title: 'Subscription / monthly plans',
    description:
      'Lock in a monthly pickup plan with recurring billing — great for hostels, families, and busy weeks.',
    icon: CalendarDays,
    accent: 'bg-success-muted text-success',
    turnaround: 'Weekly pickups',
    priceFrom: 'from ₹799/month',
    ctaHref: '/stores',
    ctaLabel: 'Browse plans',
  },
];

export const SERVICES_FAQ: ServicesFaqItem[] = [
  {
    id: 'pickup-slots',
    question: 'How do pickup slots work?',
    answer:
      'When you book through a laundry\'s detail page, you pick a pickup window that works for you — usually morning or evening slots. The partner confirms, and you get a reminder before they arrive. Slots vary by store and area.',
  },
  {
    id: 'cancellation',
    question: 'Can I cancel or reschedule an order?',
    answer:
      'Yes — open your order in the app and cancel or reschedule before pickup, as long as the laundry hasn\'t started processing. After pickup, contact the store or our support team; policies may vary slightly by partner.',
  },
  {
    id: 'garment-care',
    question: 'How do you handle delicate or special garments?',
    answer:
      'Tag items that need extra care when booking (e.g. silk, wool, embellished wear). Partners follow care-label instructions and may contact you if something needs dry clean instead of wash. When in doubt, mention it in order notes.',
  },
  {
    id: 'phone-booking',
    question: 'Can I book by phone instead of the app?',
    answer:
      'Many partner stores accept phone orders for regular customers. You\'ll still need to sign in with OTP for tracking and payments on the platform. Search a laundry on Stores and use their listed contact if you prefer calling first.',
  },
  {
    id: 'pricing-final',
    question: 'Why does my final bill differ from the "starting from" price?',
    answer:
      'Starting-from prices on this page are indicative by category. Final bills can vary with fabric, weight, and add-ons — you see the full breakdown before you pay.',
  },
  {
    id: 'express-availability',
    question: 'Is express service available everywhere?',
    answer:
      'Express and same-day turnaround depend on partner capacity and your location. Ask when you book — availability can vary by day.',
  },
];
