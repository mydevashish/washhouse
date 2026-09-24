import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import type { ContactInfo } from '@/services/customer-experience';

export const LAUNCH_STORE_CONTACT: ContactInfo = {
  can_contact: true,
  contact_available: true,
  requires_login: false,
  show_call: true,
  show_whatsapp: true,
  show_callback: false,
  show_directions: true,
  phone: '+919977751133',
  whatsapp_number: '+919977751133',
  whatsapp_url: 'https://wa.me/919977751133',
  address_line: 'Navratna Complex, near Seven Eleven Shop',
  city: 'Udaipur, Rajasthan',
  full_address: 'Navratna Complex, near Seven Eleven Shop, Udaipur, Rajasthan',
  map_url: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
  google_maps_url: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
  apple_maps_url: null,
  geo_url: null,
  latitude: null,
  longitude: null,
  working_hours: { opening: '21 September 2026, 11:00 AM' },
};

export const LAUNCH_STORE: EnrichedLaundry = {
  id: 'washhouse-udaipur',
  name: 'The WashHouse Laundry & Dryclean',
  slug: 'washhouse-udaipur',
  city: 'Udaipur, Rajasthan',
  avg_rating: '0',
  review_count: 0,
  is_verified: true,
  latitude: null,
  longitude: null,
  distanceKm: Number.NaN,
  deliveryHours: 48,
  startPrice: null,
  distanceIsApproximate: true,
  image: '/catalog/services/wash-fold.webp',
};

export const LAUNCH_STORE_DETAILS = {
  address: 'Navratna Complex, near Seven Eleven Shop, Udaipur, Rajasthan',
  opening: '21 September 2026 at 11:00 AM',
  mapsUrl: 'https://maps.app.goo.gl/JJEYk5ZndgEy5R2g8',
};
