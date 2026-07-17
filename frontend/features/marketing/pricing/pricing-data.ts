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
    title: 'Partners set their own rates',
    description:
      'Independent neighbourhood laundries handle your load — there is no fixed city-wide price list on The WashHouse.',
  },
  {
    id: 'tag',
    station: 'Price tag',
    title: 'Compare hanging rates',
    description:
      'Browse nearby stores, compare their lists, and pick the deal that fits your load — rates vary by partner.',
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
