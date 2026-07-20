import type { MarketingTestimonial } from '@/features/marketing/testimonials/types';

/** Static fallback until `GET /marketing/testimonials` ships. */
export const MARKETING_TESTIMONIALS_FALLBACK: MarketingTestimonial[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    location: 'Koramangala, Bengaluru',
    rating: 5,
    text: 'I pick a laundry on WashHouse, choose wash & fold, and they handle the rest. Pickup was on time every week.',
    isFeatured: true,
  },
  {
    id: 'rahul-menon',
    name: 'Rahul Menon',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    text: 'Easy to find a WashHouse store near me. Transparent pricing and pickup on time every week.',
    isFeatured: true,
  },
  {
    id: 'ananya-iyer',
    name: 'Ananya Iyer',
    location: 'HSR Layout, Bengaluru',
    rating: 5,
    text: 'Free pickup and delivery sold me. The app makes it easy to track when clothes are on the way back.',
    isFeatured: true,
  },
  {
    id: 'vikram-patel',
    name: 'Vikram Patel',
    location: 'Powai, Mumbai',
    rating: 5,
    text: 'Dry cleaning for my formals has never been this smooth. Transparent pricing and quick turnaround.',
    isFeatured: false,
  },
];
