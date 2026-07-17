import type { MarketingTestimonial } from '@/features/marketing/testimonials/types';

/** Static fallback until `GET /marketing/testimonials` ships. */
export const MARKETING_TESTIMONIALS_FALLBACK: MarketingTestimonial[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    location: 'Koramangala, Bengaluru',
    rating: 5,
    text: 'I pick a laundry on WashHouse, choose wash & fold, and they handle the rest. Pickup was on time every week.',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    isFeatured: true,
  },
  {
    id: 'rahul-menon',
    name: 'Rahul Menon',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    text: 'Easy to find a WashHouse store near me. Transparent pricing and pickup on time every week.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isFeatured: true,
  },
  {
    id: 'ananya-iyer',
    name: 'Ananya Iyer',
    location: 'HSR Layout, Bengaluru',
    rating: 5,
    text: 'Free pickup and delivery sold me. The app makes it easy to track when clothes are on the way back.',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    isFeatured: true,
  },
  {
    id: 'vikram-patel',
    name: 'Vikram Patel',
    location: 'Powai, Mumbai',
    rating: 5,
    text: 'Dry cleaning for my formals has never been this smooth. Transparent pricing and quick turnaround.',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    isFeatured: false,
  },
];
