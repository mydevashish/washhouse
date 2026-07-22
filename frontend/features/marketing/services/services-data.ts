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
    turnaround: '24–72 hours',
    priceFrom: 'from ₹49/piece',
    image: P.dry_clean.src,
    imageAlt: P.dry_clean.alt,
  },
  {
    id: 'steam-iron',
    title: 'Steam Iron / Press',
    description:
      'Crisp, wrinkle-free finishes for office wear, formals, and garments that need a polished look.',
    icon: Sparkles,
    accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    turnaround: '12–24 hours',
    priceFrom: 'from ₹10/piece',
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
    turnaround: '2–4 days',
    priceFrom: 'from ₹200/pair',
    image: P.shoes_bag.src,
    imageAlt: P.shoes_bag.alt,
  },
  {
    id: 'express',
    title: 'Express / same-day',
    description:
      'Same-day or next-day turnaround when you are on a tight schedule — available at participating laundries.',
    icon: Timer,
    accent: 'bg-warning-muted text-warning',
    turnaround: 'Same day – 24 hrs',
    priceFrom: 'from ₹199/kg',
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
    image: P.membership.src,
    imageAlt: P.membership.alt,
    // ctaHref: '/stores',
    ctaLabel: 'Started Soon',
  },
];

export const SERVICES_FAQ: ServicesFaqItem[] = [
  {
    id: 'how-book',
    question: 'How do I book a laundry service?',
    answer:
      'Click "Book Now" or "Schedule Pickup", fill in your name, mobile number, and required service, then submit the form. Our team or the selected laundry partner will contact you by phone or WhatsApp to confirm your pickup.',
  },
  {
    id: 'whatsapp-booking',
    question: 'Can I book through WhatsApp or by phone?',
    answer:
      'Yes. You can contact us directly through WhatsApp or call us to schedule your laundry pickup. Our team will help you complete your booking.',
  },
  {
    id: 'pricing',
    question: 'How is the final price calculated?',
    answer:
      'The prices shown on our website are starting rates. The final price depends on the garments, quantity, fabric type, and requested services. A detailed quotation and bill will be shared with you on WhatsApp before your order is processed.',
  },
  {
    id: 'pickup',
    question: 'How does pickup and delivery work?',
    answer:
      'After your booking is confirmed, our team or the laundry partner will schedule a convenient pickup time. Once your clothes are cleaned, they will be delivered back to your doorstep.',
  },
  {
    id: 'special-care',
    question: 'Can you handle delicate or premium garments?',
    answer:
      'Yes. We work with experienced laundry partners who carefully handle delicate fabrics such as silk, wool, designer wear, and other garments requiring special care.',
  },
];
