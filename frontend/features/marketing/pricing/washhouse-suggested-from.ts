/**
 * Static WashHouse suggested “from” rates for marketing /pricing fallback.
 * Mirrors backend/app/db/seed_washhouse_catalog.py — indicative only, not checkout prices.
 */

import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';

type DualSeed = {
  slug: string;
  name: string;
  category: MarketplaceFromItem['category'];
  dry: number;
  press: number | null;
  sort_order: number;
  unit?: MarketplaceFromItem['unit'];
};

type SingleSeed = {
  slug: string;
  name: string;
  category: MarketplaceFromItem['category'];
  price: number;
  sort_order: number;
  unit?: MarketplaceFromItem['unit'];
};

function dual(row: DualSeed): MarketplaceFromItem {
  return {
    catalog_item_id: `suggested-${row.slug}`,
    slug: row.slug,
    name: row.name,
    category: row.category,
    unit: row.unit ?? 'piece',
    sort_order: row.sort_order,
    currency: 'INR',
    price_mode: 'dual',
    source: 'suggested',
    from_dry_clean_inr: row.dry.toFixed(2),
    from_press_inr: row.press != null ? row.press.toFixed(2) : null,
    from_price_inr: null,
    from_dry_clean_paise: Math.round(row.dry * 100),
    from_press_paise: row.press != null ? Math.round(row.press * 100) : null,
    from_price_paise: null,
  };
}

function single(row: SingleSeed): MarketplaceFromItem {
  return {
    catalog_item_id: `suggested-${row.slug}`,
    slug: row.slug,
    name: row.name,
    category: row.category,
    unit: row.unit ?? 'piece',
    sort_order: row.sort_order,
    currency: 'INR',
    price_mode: 'single',
    source: 'suggested',
    from_dry_clean_inr: null,
    from_press_inr: null,
    from_price_inr: row.price.toFixed(2),
    from_dry_clean_paise: null,
    from_press_paise: null,
    from_price_paise: Math.round(row.price * 100),
  };
}

/** Full WashHouse indicative guide used when marketplace-from API is empty/unavailable. */
export function washhouseSuggestedFromItems(): MarketplaceFromItem[] {
  const items: MarketplaceFromItem[] = [];
  let s = 10;

  items.push(
    single({
      slug: 'kg-wash-fold',
      name: 'Wash & Fold',
      category: 'laundry_by_kg',
      price: 79,
      sort_order: s,
      unit: 'kg',
    }),
  );
  s += 10;
  items.push(
    single({
      slug: 'kg-wash-iron',
      name: 'Wash & Iron',
      category: 'laundry_by_kg',
      price: 109,
      sort_order: s,
      unit: 'kg',
    }),
  );
  s += 10;

  const men: [string, string, number, number | null][] = [
    ['men-shirt-tshirt', 'Shirt / T-shirt', 69, 15],
    ['men-trouser-jeans', 'Trouser / Jeans', 79, 15],
    ['men-lower', 'Lower', 69, 15],
    ['men-jogger-cargo', 'Jogger / Cargo', 79, 15],
    ['men-shorts', 'Shorts', 59, 15],
    ['men-dhoti-lungi', 'Dhoti / Lungi', 79, 25],
    ['men-kurta', 'Kurta', 79, 25],
    ['men-cap-fabric', 'Cap (fabric)', 39, null],
    ['men-cap-leather', 'Cap (leather)', 89, null],
    ['men-turban', 'Turban', 99, 39],
    ['men-sherwani-cotton', 'Sherwani (cotton)', 219, 59],
    ['men-sherwani-wedding', 'Sherwani (wedding)', 499, 99],
    ['men-coat-formal', 'Coat (formal)', 149, 39],
    ['men-coat-heavy', 'Coat (heavy)', 199, 49],
    ['men-suit-2pcs', 'Suit 2 pcs', 249, 59],
    ['men-suit-3pcs', 'Suit 3 pcs', 299, 69],
    ['men-vest', 'Vest', 39, 15],
    ['men-waistcoat', 'Waistcoat', 99, 35],
    ['men-wallet', 'Wallet', 49, null],
    ['men-tie', 'Tie', 39, 10],
    ['men-hanky', 'Hanky', 10, null],
  ];
  for (const [slug, name, dry, press] of men) {
    items.push(dual({ slug, name, category: 'men', dry, press, sort_order: s }));
    s += 10;
  }

  const women: [string, string, number, number | null][] = [
    ['women-saree-normal', 'Saree (normal)', 139, 49],
    ['women-saree-heavy', 'Saree (heavy)', 299, 99],
    ['women-lehenga-normal', 'Lehenga (normal)', 399, 49],
    ['women-lehenga-heavy', 'Lehenga (heavy)', 449, 99],
    ['women-blouse-choli-normal', 'Blouse / Choli (normal)', 49, 15],
    ['women-blouse-choli-heavy', 'Blouse / Choli (heavy)', 69, 25],
    ['women-gown-anarkali', 'Gown / Anarkali', 399, 119],
    ['women-skirt-short', 'Skirt (short)', 69, 15],
    ['women-skirt-long', 'Skirt (long)', 129, 39],
    ['women-full-dress-normal', 'Full Dress (normal)', 89, 20],
    ['women-full-dress-party', 'Full Dress (party)', 249, 69],
    ['women-top-kurti', 'Top / Kurti', 69, 15],
    ['women-dupatta', 'Dupatta', 59, 15],
    ['women-frock-normal', 'Frock (normal)', 129, 39],
    ['women-frock-heavy', 'Frock (heavy)', 199, 49],
    ['women-petticoat', 'Petticoat', 39, 15],
    ['women-kameez-normal', 'Kameez (normal)', 79, 20],
    ['women-kameez-fancy', 'Kameez (fancy)', 139, 39],
    ['women-burkha', 'Burkha', 99, 29],
    ['women-patiala-salwar', 'Patiala / Salwar', 79, 20],
    ['women-kurta', 'Kurta', 79, 20],
    ['women-bathrobe', 'Bathrobe', 99, 39],
    ['women-purse-s', 'Purse S', 99, null],
    ['women-purse-m', 'Purse M', 149, null],
    ['women-purse-l', 'Purse L', 299, null],
  ];
  for (const [slug, name, dry, press] of women) {
    items.push(dual({ slug, name, category: 'women', dry, press, sort_order: s }));
    s += 10;
  }

  const kids: [string, string, number, number | null][] = [
    ['kids-shirt-tshirt', 'Shirt / T-shirt', 59, 15],
    ['kids-trouser-jeans', 'Trouser / Jeans', 69, 15],
    ['kids-lower', 'Lower', 59, 15],
    ['kids-jogger-cargo', 'Jogger / Cargo', 69, 15],
    ['kids-shorts', 'Shorts', 49, 15],
    ['kids-dhoti-lungi', 'Dhoti / Lungi', 59, 20],
    ['kids-kurta', 'Kurta', 59, 20],
    ['kids-sherwani-cotton', 'Sherwani (cotton)', 179, 49],
    ['kids-sherwani-wedding', 'Sherwani (wedding)', 399, 79],
    ['kids-coat-formal', 'Coat (formal)', 119, 29],
    ['kids-coat-heavy', 'Coat (heavy)', 149, 39],
    ['kids-suit-2pcs', 'Suit 2 pcs', 179, 49],
    ['kids-suit-3pcs', 'Suit 3 pcs', 219, 59],
    ['kids-waistcoat', 'Waistcoat', 69, 25],
    ['kids-skirt', 'Skirt', 59, 15],
    ['kids-girl-dress', 'Girl Dress', 79, 20],
    ['kids-dupatta', 'Dupatta', 49, 15],
    ['kids-frock', 'Frock', 99, 25],
    ['kids-full-jacket-normal', 'Full jacket (normal)', 129, 39],
    ['kids-full-jacket-leather', 'Full jacket (leather)', 299, 59],
    ['kids-half-jacket-normal', 'Half jacket (normal)', 109, 29],
    ['kids-half-jacket-leather', 'Half jacket (leather)', 249, 59],
  ];
  for (const [slug, name, dry, press] of kids) {
    items.push(dual({ slug, name, category: 'kids', dry, press, sort_order: s }));
    s += 10;
  }

  const winter: [string, string, number, number | null][] = [
    ['winter-sweater-kids', 'Sweater (kids)', 99, 19],
    ['winter-sweater-men-women', 'Sweater (men/women)', 149, 29],
    ['winter-overcoat-kids', 'Overcoat (kids)', 149, 29],
    ['winter-overcoat-men-women', 'Overcoat (men/women)', 199, 49],
    ['winter-overcoat-leather', 'Overcoat (leather)', 499, 99],
    ['winter-jacket-cotton-denim', 'Jacket (cotton/denim)', 149, 49],
    ['winter-jacket-puffer', 'Jacket (puffer)', 199, 59],
    ['winter-jacket-leather', 'Jacket (leather)', 299, 89],
    ['winter-half-jacket-cotton-denim', 'Half Jacket (cotton/denim)', 119, 29],
    ['winter-half-jacket-puffer', 'Half Jacket (puffer)', 149, 39],
    ['winter-half-jacket-leather', 'Half Jacket (leather)', 249, 79],
    ['winter-shawl', 'Shawl', 89, 25],
    ['winter-cap', 'Winter Cap', 49, null],
    ['winter-hoodie', 'Hoodie', 169, 49],
  ];
  for (const [slug, name, dry, press] of winter) {
    items.push(dual({ slug, name, category: 'winter', dry, press, sort_order: s }));
    s += 10;
  }

  items.push(
    dual({
      slug: 'household-bedsheet-single',
      name: 'Bedsheet single',
      category: 'household',
      dry: 99,
      press: 29,
      sort_order: s,
    }),
  );
  s += 10;
  items.push(
    dual({
      slug: 'household-bedsheet-double',
      name: 'Bedsheet double',
      category: 'household',
      dry: 149,
      press: 39,
      sort_order: s,
    }),
  );
  s += 10;

  const householdSingle: [string, string, number][] = [
    ['household-blanket-4x6', 'Blanket 4×6', 169],
    ['household-blanket-double', 'Blanket double', 299],
    ['household-blanket-king', 'Blanket king', 349],
    ['household-toy-s', 'Toy S', 99],
    ['household-toy-m', 'Toy M', 149],
    ['household-toy-l', 'Toy L', 299],
    ['household-pillow-cushion-cover', 'Pillow / Cushion Cover', 29],
    ['household-shoes-sports', 'Shoes (sports)', 249],
    ['household-shoes-leather', 'Shoes (leather)', 349],
    ['household-heels', 'Heels', 299],
    ['household-bag-small', 'Bag small', 149],
    ['household-bag-large', 'Bag large', 299],
    ['household-trolley-s', 'Trolley S', 199],
    ['household-trolley-m', 'Trolley M', 299],
    ['household-trolley-l', 'Trolley L', 399],
    ['household-carpet-s', 'Carpet S', 79],
    ['household-carpet-m', 'Carpet M', 149],
    ['household-carpet-l', 'Carpet L', 219],
    ['household-bath-towel', 'Bath Towel', 59],
    ['household-comforter-single', 'Comforter single', 249],
    ['household-comforter-double', 'Comforter double', 349],
    ['household-gloves-cotton', 'Gloves cotton', 39],
    ['household-gloves-leather', 'Gloves leather', 89],
  ];
  for (const [slug, name, price] of householdSingle) {
    items.push(single({ slug, name, category: 'household', price, sort_order: s }));
    s += 10;
  }

  return items;
}
