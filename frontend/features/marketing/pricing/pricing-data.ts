export const PRICING_STATIONS = [
  {
    id: 'pickup',
    station: 'Pickup',
    title: 'Pickup arrives at your door',
    description:
      'Pickup and delivery charges depend on distance and the laundry you choose. You see the full breakdown before paying.',
  },
  {
    id: 'wash',
    station: 'Wash',
    title: 'Shared catalogue across partners',
    description:
      'Verified neighbourhood laundries on The WashHouse offer the same service menu and starting rates — pick a store by location.',
  },
  {
    id: 'tag',
    station: 'Price tag',
    title: 'Clear starting-from rates',
    description:
      'Browse the price guide for indicative “from ₹” rates by category, then open a nearby store to book pickup.',
  },
  {
    id: 'pay',
    station: 'Pay',
    title: 'UPI or cash on delivery',
    description:
      'Pay instantly with UPI at checkout, or choose COD at many partner stores — check options before you confirm.',
  },
] as const;

export type PricingStationId = (typeof PRICING_STATIONS)[number]['id'];

/** @deprecated Prefer PRICING_STATIONS — kept for docs/traceability aliases */
export const PRICING_POINTS = PRICING_STATIONS;
export type PricingPointId = PricingStationId;
