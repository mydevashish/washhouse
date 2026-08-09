/**
 * Temporary Owner Command Center imagery — reuse catalog / marketing heroes
 * until dedicated `public/partner-ops/*` art lands (Bonus C).
 */
export const OWNER_IMAGES = {
  orders: '/catalog/heroes/fresh-laundry.webp',
  logistics: '/catalog/services/on-time-delivery.webp',
  people: '/catalog/heroes/store-interior.webp',
  money: '/catalog/services/premium-laundry.webp',
  shop: '/catalog/services/wash-iron.webp',
  calm: '/catalog/services/hygienic-safe.webp',
  emptyCustomers: '/catalog/heroes/store-interior.webp',
  emptyStaff: '/catalog/heroes/store-interior.webp',
  emptyLogistics: '/catalog/services/on-time-delivery.webp',
} as const;

export type OwnerImageKey = keyof typeof OWNER_IMAGES;

export type OwnerPillarId = 'orders' | 'logistics' | 'people' | 'money' | 'shop';

export type OwnerPillarDef = {
  id: OwnerPillarId;
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

/** Illustrated pillar map for Advanced Overview (P1 demo + P2 home). */
export const OWNER_PILLARS: readonly OwnerPillarDef[] = [
  {
    id: 'orders',
    title: 'Orders',
    subtitle: 'Queue, desk, and requests',
    href: '/partner/orders',
    imageSrc: OWNER_IMAGES.orders,
    imageAlt: 'Fresh folded laundry',
  },
  {
    id: 'logistics',
    title: 'Logistics',
    subtitle: 'Pickups and deliveries',
    href: '/partner/logistics',
    imageSrc: OWNER_IMAGES.logistics,
    imageAlt: 'On-time delivery van',
  },
  {
    id: 'people',
    title: 'People',
    subtitle: 'Customers and staff',
    href: '/partner/staff',
    imageSrc: OWNER_IMAGES.people,
    imageAlt: 'Laundry shop interior',
  },
  {
    id: 'money',
    title: 'Money',
    subtitle: 'Revenue, platform cut, net',
    href: '/partner/revenue',
    imageSrc: OWNER_IMAGES.money,
    imageAlt: 'Premium laundry service',
  },
] as const;
